-- created: 2026-11-24T12:35:00-08:00
-- PRD v2 B4: Announcements & Updates lounge (rafflesiaonline write-only)

create or replace function public.ensure_lounge_announcements()
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  lounge public.chats;
  uid uuid := auth.uid();
begin
  select * into lounge from public.chats where lounge_key = 'announcements' limit 1;
  if not found then
    insert into public.chats (is_group, title, created_by, lounge_key)
    values (true, 'Announcements & Updates', uid, 'announcements')
    returning * into lounge;
  else
    update public.chats
      set title = 'Announcements & Updates', is_group = true
    where id = lounge.id
    returning * into lounge;
  end if;
  insert into public.chat_members (chat_id, user_id)
  select lounge.id, p.id from public.profiles p
  on conflict (chat_id, user_id) do nothing;
  return lounge;
end;
$$;

create or replace function public.join_lounge_announcements()
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  lounge public.chats;
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not logged in'; end if;
  lounge := public.ensure_lounge_announcements();
  insert into public.chat_members (chat_id, user_id)
  values (lounge.id, uid)
  on conflict (chat_id, user_id) do nothing;
  return lounge;
end;
$$;

-- Wrap send so announcements is write-locked to @rafflesiaonline
create or replace function public.send_chat_message(p_chat_id uuid, p_body text, p_video_url text default null)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.messages;
  restr public.user_restrictions;
  ch public.chats;
  uname text;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  select * into ch from public.chats where id = p_chat_id;
  if not found then raise exception 'Chat not found'; end if;
  if not exists(select 1 from public.chat_members where chat_id = p_chat_id and user_id = uid) then
    raise exception 'Not a member of this chat';
  end if;
  if ch.lounge_key = 'announcements' then
    select username into uname from public.profiles where id = uid;
    if lower(coalesce(uname, '')) is distinct from 'rafflesiaonline' then
      raise exception 'Only @rafflesiaonline can post in Announcements & Updates';
    end if;
  end if;
  select * into restr from public.user_restrictions where user_id = uid;
  if coalesce(restr.block_message, false) then
    raise exception 'Messaging is restricted by a teacher';
  end if;
  insert into public.messages (chat_id, sender_id, body, video_url)
  values (p_chat_id, uid, p_body, p_video_url)
  returning * into rec;
  return rec;
end;
$$;

drop trigger if exists trg_profiles_join_announcements on public.profiles;
create or replace function public.profiles_after_insert_join_announcements()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_lounge_announcements();
  insert into public.chat_members (chat_id, user_id)
  select c.id, new.id from public.chats c where c.lounge_key = 'announcements'
  on conflict do nothing;
  return new;
end;
$$;

create trigger trg_profiles_join_announcements
  after insert on public.profiles
  for each row
  execute function public.profiles_after_insert_join_announcements();

revoke all on function public.ensure_lounge_announcements() from public;
revoke all on function public.join_lounge_announcements() from public;
grant execute on function public.ensure_lounge_announcements() to authenticated;
grant execute on function public.join_lounge_announcements() to authenticated;
