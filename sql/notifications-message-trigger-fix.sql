-- created: 2026-11-25T00:40:00-08:00
-- Fix: @mentions notify in DMs/groups (not only Lounge Everyone); harden mention parse.
-- Run this in Supabase after sql/notifications.sql (or re-run full notifications.sql).

create or replace function public.trg_notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- created: 2026-11-25T00:40:00-08:00
  ch public.chats;
  actor_name text;
  snippet text;
  m record;
  mentioned uuid;
begin
  select * into ch from public.chats where id = new.chat_id;
  if not found then return new; end if;

  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.sender_id;
  snippet := left(coalesce(new.body, '📷'), 80);

  -- 1) Always notify @mentioned people (DM, group, Everyone, Announcements)
  for mentioned in
    select distinct p.id
    from regexp_matches(coalesce(new.body, ''), '@([a-z0-9_]{1,32})', 'gi') as rm(cap)
    join public.profiles p on lower(p.username) = lower(rm.cap[1])
    where p.id is distinct from new.sender_id
  loop
    perform public.emit_notification(
      mentioned,
      new.sender_id,
      'chat_mention',
      coalesce(actor_name, 'Someone') || ' mentioned you',
      snippet,
      'chat',
      new.chat_id::text,
      new.chat_id
    );
  end loop;

  -- 2) Announcements → every other lounge member
  if ch.lounge_key = 'announcements' then
    for m in
      select cm.user_id
      from public.chat_members cm
      where cm.chat_id = new.chat_id
        and cm.user_id is distinct from new.sender_id
    loop
      perform public.emit_notification(
        m.user_id, new.sender_id, 'announcement',
        'Club announcement', snippet, 'chat', new.chat_id::text, new.chat_id
      );
    end loop;
    return new;
  end if;

  -- 3) Lounge Everyone → mentions only (already done in step 1)
  if ch.lounge_key = 'everyone' then
    return new;
  end if;

  -- 4) DM / normal group → other members (skip if already mentioned to avoid dup spam:
  --    still send chat_message; inbox can show both — prefer message for members)
  for m in
    select cm.user_id
    from public.chat_members cm
    where cm.chat_id = new.chat_id
      and cm.user_id is distinct from new.sender_id
  loop
    perform public.emit_notification(
      m.user_id, new.sender_id, 'chat_message',
      coalesce(actor_name, 'Someone') || ' sent a message',
      snippet, 'chat', new.chat_id::text, new.chat_id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_notify_on_message on public.messages;
create trigger trg_notify_on_message
  after insert on public.messages
  for each row execute function public.trg_notify_on_message();

-- Quick check (optional): should return trg_notify_on_message
-- select tgname from pg_trigger where not tgisinternal and tgname like 'trg_notify%';
