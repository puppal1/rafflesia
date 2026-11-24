-- created: 2026-11-23T21:00:00-08:00
-- Phase 5 first-cut: icons, text flags, restrictions, posts, teacher password, realtime
-- Run once in Supabase SQL Editor after fix-follows + fix-group-members.

-- Profile icons (packs)
alter table public.profiles
  add column if not exists icon_pack text,
  add column if not exists icon_id text;

-- Blocked words (teacher-editable)
create table if not exists public.blocked_words (
  id uuid primary key default gen_random_uuid(),
  phrase text not null unique,
  kind text not null default 'bad',
  created_at timestamptz not null default now()
);

-- Flagged text attempts
create table if not exists public.text_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  context text not null,
  body text not null,
  matched text,
  created_at timestamptz not null default now()
);

-- Mute post / message
create table if not exists public.user_restrictions (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  block_post boolean not null default false,
  block_message boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Simple posts for Home
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('text', 'link', 'picture', 'video')),
  body text,
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null
);

insert into public.app_settings (key, value)
values ('teacher_password', 'teacher108')
on conflict (key) do nothing;

alter table public.blocked_words enable row level security;
alter table public.text_flags enable row level security;
alter table public.user_restrictions enable row level security;
alter table public.posts enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "blocked_words_select" on public.blocked_words;
create policy "blocked_words_select" on public.blocked_words for select to authenticated using (true);

drop policy if exists "text_flags_insert_own" on public.text_flags;
create policy "text_flags_insert_own" on public.text_flags for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "text_flags_select_authenticated" on public.text_flags;
create policy "text_flags_select_authenticated" on public.text_flags for select to authenticated using (true);

drop policy if exists "restrictions_select" on public.user_restrictions;
create policy "restrictions_select" on public.user_restrictions for select to authenticated using (true);

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select to authenticated using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated
  with check (author_id = auth.uid());

-- Teacher helpers (security definer)
create or replace function public.verify_teacher_password(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
begin
  select value into expected from public.app_settings where key = 'teacher_password';
  return coalesce(expected, '') = coalesce(p_password, '');
end;
$$;

create or replace function public.set_my_icon(p_pack text, p_icon text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.profiles;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  update public.profiles
    set icon_pack = nullif(trim(p_pack), ''),
        icon_id = nullif(trim(p_icon), '')
  where id = uid
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.flag_blocked_text(p_context text, p_body text, p_matched text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not logged in'; end if;
  insert into public.text_flags (user_id, context, body, matched)
  values (uid, coalesce(p_context, 'unknown'), coalesce(p_body, ''), p_matched);
end;
$$;

create or replace function public.list_blocked_phrases()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  arr text[];
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  select coalesce(array_agg(lower(phrase)), '{}'::text[]) into arr from public.blocked_words;
  return arr;
end;
$$;

-- updated: 2026-11-23T21:05:00-08:00 — teacher RPCs gated by shared password (anon OK)
create or replace function public.teacher_list_flags(p_password text)
returns table (
  id uuid,
  user_id uuid,
  username text,
  context text,
  body text,
  matched text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  return query
  select f.id, f.user_id, p.username, f.context, f.body, f.matched, f.created_at
  from public.text_flags f
  join public.profiles p on p.id = f.user_id
  order by f.created_at desc
  limit 100;
end;
$$;

create or replace function public.teacher_set_restriction(
  p_password text,
  p_user_id uuid,
  p_block_post boolean,
  p_block_message boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  insert into public.user_restrictions (user_id, block_post, block_message, updated_at)
  values (p_user_id, coalesce(p_block_post, false), coalesce(p_block_message, false), now())
  on conflict (user_id) do update
    set block_post = excluded.block_post,
        block_message = excluded.block_message,
        updated_at = now();
end;
$$;

create or replace function public.teacher_add_blocked_word(
  p_password text,
  p_phrase text,
  p_kind text default 'bad'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  insert into public.blocked_words (phrase, kind)
  values (lower(trim(p_phrase)), coalesce(nullif(trim(p_kind), ''), 'bad'))
  on conflict (phrase) do nothing;
end;
$$;

create or replace function public.teacher_remove_blocked_word(p_password text, p_phrase text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  delete from public.blocked_words where phrase = lower(trim(p_phrase));
end;
$$;

create or replace function public.teacher_list_words(p_password text)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  arr text[];
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  select coalesce(array_agg(lower(phrase) order by phrase), '{}'::text[]) into arr
  from public.blocked_words;
  return arr;
end;
$$;

create or replace function public.teacher_overview(p_password text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  post_n int;
  chat_n int;
  flag_n int;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  select count(*) into post_n from public.posts;
  select count(*) into chat_n from public.chats;
  select count(*) into flag_n from public.text_flags;
  return json_build_object('posts', post_n, 'chats', chat_n, 'flags', flag_n);
end;
$$;

-- created: 2026-11-23T21:05:00-08:00 — resolve username without kid session
create or replace function public.teacher_find_user(p_password text, p_username text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  select id into uid from public.profiles
  where lower(username) = lower(trim(both from p_username))
  limit 1;
  return uid;
end;
$$;

create or replace function public.my_restrictions()
returns public.user_restrictions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.user_restrictions;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  select * into rec from public.user_restrictions where user_id = uid;
  if not found then
    rec.user_id := uid;
    rec.block_post := false;
    rec.block_message := false;
    rec.updated_at := now();
  end if;
  return rec;
end;
$$;

create or replace function public.create_post(p_kind text, p_body text, p_media_url text default null)
returns public.posts
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.posts;
  restr public.user_restrictions;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  select * into restr from public.user_restrictions where user_id = uid;
  if coalesce(restr.block_post, false) then
    raise exception 'Posting is restricted by a teacher';
  end if;
  insert into public.posts (author_id, kind, body, media_url)
  values (uid, p_kind, p_body, p_media_url)
  returning * into rec;
  return rec;
end;
$$;

-- updated: 2026-11-23T21:05:00-08:00
revoke all on function public.verify_teacher_password(text) from public;
revoke all on function public.set_my_icon(text, text) from public;
revoke all on function public.flag_blocked_text(text, text, text) from public;
revoke all on function public.list_blocked_phrases() from public;
revoke all on function public.teacher_list_flags(text) from public;
revoke all on function public.teacher_set_restriction(text, uuid, boolean, boolean) from public;
revoke all on function public.teacher_add_blocked_word(text, text, text) from public;
revoke all on function public.teacher_remove_blocked_word(text, text) from public;
revoke all on function public.teacher_list_words(text) from public;
revoke all on function public.teacher_overview(text) from public;
revoke all on function public.teacher_find_user(text, text) from public;
revoke all on function public.my_restrictions() from public;
revoke all on function public.create_post(text, text, text) from public;

grant execute on function public.verify_teacher_password(text) to authenticated, anon;
grant execute on function public.set_my_icon(text, text) to authenticated;
grant execute on function public.flag_blocked_text(text, text, text) to authenticated;
grant execute on function public.list_blocked_phrases() to authenticated;
grant execute on function public.teacher_list_flags(text) to authenticated, anon;
grant execute on function public.teacher_set_restriction(text, uuid, boolean, boolean) to authenticated, anon;
grant execute on function public.teacher_add_blocked_word(text, text, text) to authenticated, anon;
grant execute on function public.teacher_remove_blocked_word(text, text) to authenticated, anon;
grant execute on function public.teacher_list_words(text) to authenticated, anon;
grant execute on function public.teacher_overview(text) to authenticated, anon;
grant execute on function public.teacher_find_user(text, text) to authenticated, anon;
grant execute on function public.my_restrictions() to authenticated;
grant execute on function public.create_post(text, text, text) to authenticated;

-- Seed a few blocked phrases
insert into public.blocked_words (phrase, kind) values
  ('kill you', 'threat'),
  ('kys', 'threat'),
  ('hate you', 'mean'),
  ('go die', 'threat')
on conflict (phrase) do nothing;

-- Realtime (best effort)
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.message_likes;
  exception when others then null;
  end;
end $$;
