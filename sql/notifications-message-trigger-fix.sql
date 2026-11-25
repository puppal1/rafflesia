-- created: 2026-11-25T00:40:00-08:00
-- updated: 2026-11-25T00:55:00-08:00 — private DMs never emit bloom notifications
-- Run in Supabase SQL Editor (after sql/notifications.sql).

create or replace function public.trg_notify_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- created: 2026-11-25T00:40:00-08:00
  -- updated: 2026-11-25T00:55:00-08:00
  ch public.chats;
  actor_name text;
  snippet text;
  m record;
  mentioned uuid;
begin
  select * into ch from public.chats where id = new.chat_id;
  if not found then return new; end if;

  -- Private 1:1 DMs: no bloom notifications
  if coalesce(ch.is_group, false) = false and ch.lounge_key is null then
    return new;
  end if;

  select coalesce(nullif(trim(display_name), ''), username) into actor_name
  from public.profiles where id = new.sender_id;
  snippet := left(coalesce(new.body, '📷'), 80);

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

  if ch.lounge_key = 'everyone' then
    return new;
  end if;

  -- Named group chats only
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
