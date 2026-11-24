-- created: 2026-11-23T19:57:00-08:00
-- updated: 2026-11-23T20:45:00-08:00 — create+members, add members, shared groups, member ids
-- Group discovery = invite/add (GROUP_CHAT_WF.md). Run in Supabase SQL Editor.

create unique index if not exists chat_members_chat_user_uidx
  on public.chat_members (chat_id, user_id);

-- Drop old 1-arg signature if present (replaced by defaulted 2-arg)
drop function if exists public.create_group_chat(text);

create or replace function public.create_group_chat(p_title text, p_member_ids uuid[] default '{}')
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
-- created: 2026-11-23T19:57:00-08:00
-- updated: 2026-11-23T20:45:00-08:00
declare
  uid uuid := auth.uid();
  title text := trim(coalesce(p_title, ''));
  new_chat public.chats;
  mid uuid;
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
  values (new_chat.id, uid)
  on conflict do nothing;

  if p_member_ids is not null then
    foreach mid in array p_member_ids
    loop
      if mid is not null and mid <> uid then
        insert into public.chat_members (chat_id, user_id)
        values (new_chat.id, mid)
        on conflict do nothing;
      end if;
    end loop;
  end if;

  return new_chat;
end;
$$;

create or replace function public.add_group_members(p_chat_id uuid, p_member_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
-- created: 2026-11-23T19:57:00-08:00
declare
  uid uuid := auth.uid();
  mid uuid;
  is_grp boolean;
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
  select is_group into is_grp from public.chats where id = p_chat_id;
  if coalesce(is_grp, false) = false then
    raise exception 'Not a group chat';
  end if;

  if p_member_ids is not null then
    foreach mid in array p_member_ids
    loop
      if mid is not null and mid <> uid then
        insert into public.chat_members (chat_id, user_id)
        values (p_chat_id, mid)
        on conflict do nothing;
      end if;
    end loop;
  end if;
end;
$$;

-- created: 2026-11-23T20:45:00-08:00
create or replace function public.list_group_member_ids(p_chat_id uuid)
returns uuid[]
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  ids uuid[];
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
  select coalesce(array_agg(user_id), '{}'::uuid[])
    into ids
  from public.chat_members
  where chat_id = p_chat_id;
  return ids;
end;
$$;

-- created: 2026-11-23T20:45:00-08:00 — groups both users belong to
create or replace function public.list_shared_group_chats(p_other_user_id uuid)
returns setof public.chats
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
  if p_other_user_id is null then
    raise exception 'Missing user';
  end if;
  return query
  select c.*
  from public.chats c
  where c.is_group = true
    and exists (
      select 1 from public.chat_members m
      where m.chat_id = c.id and m.user_id = uid
    )
    and (
      p_other_user_id = uid
      or exists (
        select 1 from public.chat_members m2
        where m2.chat_id = c.id and m2.user_id = p_other_user_id
      )
    )
  order by c.created_at desc;
end;
$$;

revoke all on function public.create_group_chat(text, uuid[]) from public;
revoke all on function public.add_group_members(uuid, uuid[]) from public;
revoke all on function public.list_group_member_ids(uuid) from public;
revoke all on function public.list_shared_group_chats(uuid) from public;
grant execute on function public.create_group_chat(text, uuid[]) to authenticated;
grant execute on function public.add_group_members(uuid, uuid[]) to authenticated;
grant execute on function public.list_group_member_ids(uuid) to authenticated;
grant execute on function public.list_shared_group_chats(uuid) to authenticated;
