-- created: 2026-11-23T21:30:00-08:00
-- Patch: missing set_my_icon / create_post + teacher search + larger word seed
-- Safe to re-run after phase5-first-cut.sql

-- Ensure columns / tables exist
alter table public.profiles
  add column if not exists icon_pack text,
  add column if not exists icon_id text;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('text', 'link', 'picture', 'video')),
  body text,
  media_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.blocked_words (
  id uuid primary key default gen_random_uuid(),
  phrase text not null unique,
  kind text not null default 'bad',
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;
alter table public.blocked_words enable row level security;

drop policy if exists "posts_select" on public.posts;
create policy "posts_select" on public.posts for select to authenticated using (true);
drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert to authenticated
  with check (author_id = auth.uid());
drop policy if exists "blocked_words_select" on public.blocked_words;
create policy "blocked_words_select" on public.blocked_words for select to authenticated using (true);

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

-- Typeahead: search kids by username / display name
create or replace function public.teacher_search_users(p_password text, p_query text)
returns table (
  id uuid,
  username text,
  display_name text,
  bio text,
  avatar_url text,
  banner_url text,
  icon_pack text,
  icon_id text,
  block_post boolean,
  block_message boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  q text := lower(trim(both from coalesce(p_query, '')));
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  if length(q) < 1 then
    return;
  end if;
  return query
  select
    p.id,
    p.username,
    p.display_name,
    coalesce(p.bio, ''),
    p.avatar_url,
    p.banner_url,
    p.icon_pack,
    p.icon_id,
    coalesce(r.block_post, false),
    coalesce(r.block_message, false)
  from public.profiles p
  left join public.user_restrictions r on r.user_id = p.id
  where p.username ilike '%' || q || '%'
     or p.display_name ilike '%' || q || '%'
  order by p.username
  limit 20;
end;
$$;

create or replace function public.teacher_get_profile(p_password text, p_user_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  select
    p.id, p.username, p.display_name, p.bio, p.avatar_url, p.banner_url,
    p.icon_pack, p.icon_id,
    coalesce(r.block_post, false) as block_post,
    coalesce(r.block_message, false) as block_message
  into rec
  from public.profiles p
  left join public.user_restrictions r on r.user_id = p.id
  where p.id = p_user_id;
  if not found then return null; end if;
  return row_to_json(rec);
end;
$$;

revoke all on function public.set_my_icon(text, text) from public;
revoke all on function public.create_post(text, text, text) from public;
revoke all on function public.teacher_search_users(text, text) from public;
revoke all on function public.teacher_get_profile(text, uuid) from public;

grant execute on function public.set_my_icon(text, text) to authenticated;
grant execute on function public.create_post(text, text, text) to authenticated;
grant execute on function public.teacher_search_users(text, text) to authenticated, anon;
grant execute on function public.teacher_get_profile(text, uuid) to authenticated, anon;

-- Larger school-safe seed (teacher can still edit)
insert into public.blocked_words (phrase, kind) values
  ('kill you', 'threat'),
  ('kys', 'threat'),
  ('hate you', 'mean'),
  ('go die', 'threat'),
  ('kill yourself', 'threat'),
  ('kill myself', 'threat'),
  ('i will kill', 'threat'),
  ('want you dead', 'threat'),
  ('die bitch', 'threat'),
  ('fuck', 'vulgar'),
  ('fucker', 'vulgar'),
  ('fucking', 'vulgar'),
  ('shit', 'vulgar'),
  ('bitch', 'vulgar'),
  ('asshole', 'vulgar'),
  ('bastard', 'vulgar'),
  ('dick', 'vulgar'),
  ('cock', 'vulgar'),
  ('pussy', 'vulgar'),
  ('cunt', 'vulgar'),
  ('slut', 'vulgar'),
  ('whore', 'vulgar'),
  ('rape', 'threat'),
  ('retard', 'slur'),
  ('retarded', 'slur'),
  ('nigger', 'slur'),
  ('nigga', 'slur'),
  ('faggot', 'slur'),
  ('fag', 'slur'),
  ('suicide', 'selfharm'),
  ('killme', 'selfharm'),
  ('killyou', 'threat'),
  ('shut up idiot', 'mean'),
  ('you suck', 'mean'),
  ('i hate you', 'mean'),
  ('stupid bitch', 'mean')
on conflict (phrase) do nothing;
