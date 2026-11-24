-- created: 2026-11-23T19:57:00-08:00
-- Group discovery = invite/add friends (not a public group browser)
-- Run in Supabase SQL editor after prior helpers.

-- Drop old 1-arg version if present
drop function if exists public.create_group_chat(text);

create or replace function public.create_group_chat(p_title text, p_member_ids uuid[] default '{}')
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
-- created: 2026-11-23T19:57:00-08:00
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
  values (new_chat.id, uid);

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

revoke all on function public.create_group_chat(text, uuid[]) from public;
revoke all on function public.add_group_members(uuid, uuid[]) from public;
grant execute on function public.create_group_chat(text, uuid[]) to authenticated;
grant execute on function public.add_group_members(uuid, uuid[]) to authenticated;
