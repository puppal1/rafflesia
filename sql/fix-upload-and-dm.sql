-- created: 2026-11-23T12:35:00-08:00
-- fix: uploading photos must NOT reset name/bio
-- fix: start DM via secure helper

create or replace function public.ensure_my_profile(p_username text, p_display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  uname text;
  dname text;
  rec public.profiles;
begin
  if uid is null then
    raise exception 'Not logged in (auth.uid is null)';
  end if;

  select * into rec from public.profiles where id = uid;
  if found then
    return rec;
  end if;

  uname := lower(regexp_replace(coalesce(nullif(p_username, ''), 'user'), '[^a-z0-9_]', '', 'g'));
  if uname = '' then
    uname := 'user' || substr(replace(uid::text, '-', ''), 1, 8);
  end if;
  dname := coalesce(nullif(p_display_name, ''), uname);

  insert into public.profiles (id, username, display_name, bio)
  values (uid, uname, dname, '')
  on conflict (id) do nothing;

  select * into rec from public.profiles where id = uid;
  return rec;
end;
$$;

create or replace function public.set_my_profile_image(p_kind text, p_url text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.profiles;
begin
  if uid is null then
    raise exception 'Not logged in (auth.uid is null)';
  end if;
  if p_kind not in ('avatar', 'banner') then
    raise exception 'kind must be avatar or banner';
  end if;

  -- create row only if missing; never overwrite name/bio
  perform public.ensure_my_profile(
    'user' || substr(replace(uid::text, '-', ''), 1, 8),
    'Friend'
  );

  if p_kind = 'avatar' then
    update public.profiles
      set avatar_url = p_url
      where id = uid
      returning * into rec;
  else
    update public.profiles
      set banner_url = p_url
      where id = uid
      returning * into rec;
  end if;

  return rec;
end;
$$;

create or replace function public.start_dm(p_other_user_id uuid)
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing_id uuid;
  new_chat public.chats;
begin
  if uid is null then
    raise exception 'Not logged in (auth.uid is null)';
  end if;
  if p_other_user_id is null or p_other_user_id = uid then
    raise exception 'Invalid user';
  end if;
  if not exists (select 1 from public.profiles where id = p_other_user_id) then
    raise exception 'That user has no profile';
  end if;

  -- find existing non-group chat shared by both users
  select c.id into existing_id
  from public.chats c
  join public.chat_members m1 on m1.chat_id = c.id and m1.user_id = uid
  join public.chat_members m2 on m2.chat_id = c.id and m2.user_id = p_other_user_id
  where c.is_group = false
  limit 1;

  if existing_id is not null then
    select * into new_chat from public.chats where id = existing_id;
    return new_chat;
  end if;

  insert into public.chats (is_group, title, created_by)
  values (false, null, uid)
  returning * into new_chat;

  insert into public.chat_members (chat_id, user_id)
  values
    (new_chat.id, uid),
    (new_chat.id, p_other_user_id);

  return new_chat;
end;
$$;

revoke all on function public.ensure_my_profile(text, text) from public;
revoke all on function public.set_my_profile_image(text, text) from public;
revoke all on function public.start_dm(uuid) from public;
grant execute on function public.ensure_my_profile(text, text) to authenticated;
grant execute on function public.set_my_profile_image(text, text) to authenticated;
grant execute on function public.start_dm(uuid) to authenticated;
