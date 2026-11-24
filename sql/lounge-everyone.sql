-- created: 2026-11-23T22:35:00-08:00
-- Rafflesia Lounge: Everyone group chat auto-includes all signups

alter table public.chats
  add column if not exists lounge_key text;

create unique index if not exists chats_lounge_key_uidx
  on public.chats (lounge_key)
  where lounge_key is not null;

-- Ensure the single Everyone lounge chat exists and every profile is a member
create or replace function public.ensure_lounge_everyone()
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  lounge public.chats;
  uid uuid := auth.uid();
begin
  select * into lounge
  from public.chats
  where lounge_key = 'everyone'
  limit 1;

  if not found then
    insert into public.chats (is_group, title, created_by, lounge_key)
    values (true, 'Everyone', uid, 'everyone')
    returning * into lounge;
  else
    update public.chats
      set title = 'Everyone',
          is_group = true
    where id = lounge.id
    returning * into lounge;
  end if;

  insert into public.chat_members (chat_id, user_id)
  select lounge.id, p.id
  from public.profiles p
  on conflict (chat_id, user_id) do nothing;

  return lounge;
end;
$$;

-- Join current user into Everyone (safe to call often)
create or replace function public.join_lounge_everyone()
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  lounge public.chats;
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;

  lounge := public.ensure_lounge_everyone();

  insert into public.chat_members (chat_id, user_id)
  values (lounge.id, uid)
  on conflict (chat_id, user_id) do nothing;

  return lounge;
end;
$$;

-- Auto-join on every new profile row (signup)
create or replace function public.profiles_after_insert_join_everyone()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lounge_id uuid;
begin
  select id into lounge_id from public.chats where lounge_key = 'everyone' limit 1;
  if lounge_id is null then
    insert into public.chats (is_group, title, created_by, lounge_key)
    values (true, 'Everyone', new.id, 'everyone')
    returning id into lounge_id;
  end if;

  insert into public.chat_members (chat_id, user_id)
  values (lounge_id, new.id)
  on conflict (chat_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_profiles_join_everyone on public.profiles;
create trigger trg_profiles_join_everyone
  after insert on public.profiles
  for each row
  execute function public.profiles_after_insert_join_everyone();

-- Block inviting into Everyone (membership is automatic)
create or replace function public.add_group_members(p_chat_id uuid, p_member_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  is_grp boolean;
  key text;
  mid uuid;
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;
  if not exists (
    select 1 from public.chat_members
    where chat_id = p_chat_id and user_id = uid
  ) then
    raise exception 'You are not in this chat';
  end if;
  select is_group, lounge_key into is_grp, key from public.chats where id = p_chat_id;
  if not coalesce(is_grp, false) then
    raise exception 'Not a group chat';
  end if;
  if key = 'everyone' then
    raise exception 'Everyone includes all club members automatically';
  end if;
  if p_member_ids is null then
    return;
  end if;
  foreach mid in array p_member_ids loop
    if mid is not null and mid <> uid then
      insert into public.chat_members (chat_id, user_id)
      values (p_chat_id, mid)
      on conflict (chat_id, user_id) do nothing;
    end if;
  end loop;
end;
$$;

-- Do not let kids create a second "Everyone" lounge clone by name
create or replace function public.create_group_chat(p_title text, p_member_ids uuid[] default '{}')
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  title text;
  new_chat public.chats;
  mid uuid;
begin
  if uid is null then
    raise exception 'Not logged in';
  end if;
  title := trim(coalesce(p_title, ''));
  if title = '' then
    raise exception 'Group needs a name';
  end if;
  if lower(title) = 'everyone' then
    raise exception 'Everyone already exists in Rafflesia Lounge';
  end if;

  insert into public.chats (is_group, title, created_by)
  values (true, title, uid)
  returning * into new_chat;

  insert into public.chat_members (chat_id, user_id)
  values (new_chat.id, uid)
  on conflict (chat_id, user_id) do nothing;

  if p_member_ids is not null then
    foreach mid in array p_member_ids loop
      if mid is not null and mid <> uid then
        insert into public.chat_members (chat_id, user_id)
        values (new_chat.id, mid)
        on conflict (chat_id, user_id) do nothing;
      end if;
    end loop;
  end if;

  return new_chat;
end;
$$;

-- One-shot: create Everyone + backfill every existing profile
select public.ensure_lounge_everyone();

revoke all on function public.ensure_lounge_everyone() from public;
revoke all on function public.join_lounge_everyone() from public;
grant execute on function public.ensure_lounge_everyone() to authenticated, anon;
grant execute on function public.join_lounge_everyone() to authenticated;
grant execute on function public.add_group_members(uuid, uuid[]) to authenticated;
grant execute on function public.create_group_chat(text, uuid[]) to authenticated;
