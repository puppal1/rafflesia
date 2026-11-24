-- created: 2026-11-23T12:42:00-08:00
-- fix follow + create group + repair "Friend" names

-- repair names ruined by earlier upload bug
update public.profiles
set display_name = username
where lower(coalesce(display_name, '')) in ('friend', '');

create or replace function public.toggle_follow(p_other_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;
  if p_other_user_id is null or p_other_user_id = uid then
    raise exception 'Invalid user';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'That user has no profile';
  end if;

  if exists (
    select 1 from public.follows
    where follower_id = uid and following_id = p_other_user_id
  ) then
    delete from public.follows
    where follower_id = uid and following_id = p_other_user_id;
    return 'unfollowed';
  end if;

  insert into public.follows (follower_id, following_id)
  values (uid, p_other_user_id);
  return 'followed';
end;
$$;

create or replace function public.create_group_chat(p_title text)
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  title text := trim(coalesce(p_title, ''));
  new_chat public.chats;
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;
  if title = '' then
    raise exception 'Group needs a name';
  end if;

  insert into public.chats (is_group, title, created_by)
  values (true, title, uid)
  returning * into new_chat;

  insert into public.chat_members (chat_id, user_id)
  values (new_chat.id, uid);

  return new_chat;
end;
$$;

create or replace function public.send_chat_message(p_chat_id uuid, p_body text)
returns public.messages
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  body text := trim(coalesce(p_body, ''));
  rec public.messages;
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;
  if body = '' then
    raise exception 'Message is empty';
  end if;
  if not exists (
    select 1 from public.chat_members
    where chat_id = p_chat_id and user_id = uid
  ) then
    raise exception 'You are not in this chat';
  end if;

  insert into public.messages (chat_id, sender_id, body)
  values (p_chat_id, uid, body)
  returning * into rec;

  return rec;
end;
$$;

revoke all on function public.toggle_follow(uuid) from public;
revoke all on function public.create_group_chat(text) from public;
revoke all on function public.send_chat_message(uuid, text) from public;
grant execute on function public.toggle_follow(uuid) to authenticated;
grant execute on function public.create_group_chat(text) to authenticated;
grant execute on function public.send_chat_message(uuid, text) to authenticated;
