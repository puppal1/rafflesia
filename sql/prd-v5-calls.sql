-- created: 2026-11-25T20:40:00-08:00
-- updated: 2026-11-25T20:45:00-08:00 — app locks voice-only + invite groups; RPC still accepts voice
-- PRD v5: voice call sessions (invite groups). Run in Supabase SQL Editor.

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  mode text not null check (mode in ('voice', 'video')),
  room_slug text not null unique,
  status text not null default 'active' check (status in ('active', 'ended')),
  created_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists call_sessions_chat_active_idx
  on public.call_sessions (chat_id, status, created_at desc);

alter table public.call_sessions enable row level security;

drop policy if exists "call_sessions_select_member" on public.call_sessions;
create policy "call_sessions_select_member" on public.call_sessions for select to authenticated
  using (exists (
    select 1 from public.chat_members m
    where m.chat_id = call_sessions.chat_id and m.user_id = auth.uid()
  ));

create or replace function public.start_chat_call(p_chat_id uuid, p_mode text)
returns public.call_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  mode text := lower(trim(coalesce(p_mode, 'video')));
  lounge text;
  block_msg boolean := false;
  existing public.call_sessions;
  rec public.call_sessions;
  slug text;
  actor text;
  label text;
begin
  -- created: 2026-11-25T20:40:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  -- updated: 2026-11-25T20:45:00-08:00 — voice only
  if mode <> 'voice' then raise exception 'Only voice calls are allowed.'; end if;

  if not exists (
    select 1 from public.chat_members where chat_id = p_chat_id and user_id = uid
  ) then raise exception 'Not in this chat'; end if;

  -- invite groups only (not DMs, Everyone, Announcements)
  -- updated: 2026-11-25T20:45:00-08:00
  if not exists (
    select 1 from public.chats c
    where c.id = p_chat_id and c.is_group = true
  ) then
    raise exception 'Voice calls are only for group chats.';
  end if;
  select c.lounge_key into lounge from public.chats c where c.id = p_chat_id;
  if lounge = 'announcements' then
    raise exception 'Calls are not available in Announcements.';
  end if;
  if lounge = 'everyone' then
    raise exception 'Voice calls are for invite groups only, not Everyone.';
  end if;

  if to_regclass('public.user_restrictions') is not null then
    select coalesce(block_message, false) into block_msg
    from public.user_restrictions where user_id = uid;
  end if;
  if coalesce(block_msg, false) then
    raise exception 'Messaging is restricted by a teacher';
  end if;

  select * into existing
  from public.call_sessions
  where chat_id = p_chat_id and status = 'active'
  order by created_at desc
  limit 1;

  if existing.id is not null then
    return existing;
  end if;

  slug := replace(gen_random_uuid()::text, '-', '');

  insert into public.call_sessions (chat_id, created_by, mode, room_slug, status)
  values (p_chat_id, uid, mode, slug, 'active')
  returning * into rec;

  select coalesce(nullif(trim(display_name), ''), username) into actor
  from public.profiles where id = uid;
  label := case when mode = 'voice' then 'voice' else 'video' end;

  insert into public.messages (chat_id, sender_id, body, video_url)
  values (
    p_chat_id,
    uid,
    '@@call:' || rec.id::text || ':' || mode || '@@ ' || coalesce(actor, 'Someone') || ' started a ' || label || ' call',
    null
  );

  return rec;
end;
$$;

create or replace function public.end_chat_call(p_call_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  chat uuid;
begin
  -- created: 2026-11-25T20:40:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  select chat_id into chat from public.call_sessions where id = p_call_id;
  if chat is null then return; end if;
  if not exists (
    select 1 from public.chat_members where chat_id = chat and user_id = uid
  ) then raise exception 'Not in this chat'; end if;

  update public.call_sessions
    set status = 'ended', ended_at = now()
  where id = p_call_id and status = 'active';
end;
$$;

create or replace function public.get_active_chat_call(p_chat_id uuid)
returns public.call_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.call_sessions;
begin
  -- created: 2026-11-25T20:40:00-08:00
  if uid is null then raise exception 'Not logged in'; end if;
  if not exists (
    select 1 from public.chat_members where chat_id = p_chat_id and user_id = uid
  ) then raise exception 'Not in this chat'; end if;

  select * into rec
  from public.call_sessions
  where chat_id = p_chat_id and status = 'active'
  order by created_at desc
  limit 1;
  return rec;
end;
$$;

create or replace function public.list_my_ringing_calls()
returns setof public.call_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  -- created: 2026-11-25T20:40:00-08:00
  if uid is null then return; end if;
  return query
  select cs.*
  from public.call_sessions cs
  join public.chat_members m on m.chat_id = cs.chat_id and m.user_id = uid
  where cs.status = 'active'
    and cs.created_by is distinct from uid
    and cs.created_at > now() - interval '2 hours'
  order by cs.created_at desc
  limit 10;
end;
$$;

revoke all on function public.start_chat_call(uuid, text) from public;
revoke all on function public.end_chat_call(uuid) from public;
revoke all on function public.get_active_chat_call(uuid) from public;
revoke all on function public.list_my_ringing_calls() from public;
grant execute on function public.start_chat_call(uuid, text) to authenticated;
grant execute on function public.end_chat_call(uuid) to authenticated;
grant execute on function public.get_active_chat_call(uuid) to authenticated;
grant execute on function public.list_my_ringing_calls() to authenticated;

-- Realtime (ignore error if already added)
do $$
begin
  alter publication supabase_realtime add table public.call_sessions;
exception when duplicate_object then
  null;
when others then
  null;
end $$;
