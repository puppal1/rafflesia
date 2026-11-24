-- created: 2026-11-23T23:20:00-08:00
-- updated: 2026-11-23T23:25:00-08:00 — skip tables that were never created
-- Wipe all club accounts + their posts EXCEPT @diyaan and @rafflesiaonline
-- Run in Supabase SQL Editor (project dashboard). Destructive. One-shot.

begin;

create temporary table keep_ids on commit drop as
select id, username
from public.profiles
where lower(username) in ('diyaan', 'rafflesiaonline');

do $$
declare
  n int;
begin
  select count(*) into n from keep_ids;
  if n < 1 then
    raise exception 'Abort: no keeper profiles found for diyaan / rafflesiaonline';
  end if;
  raise notice 'Keeping % profile(s): %', n, (select string_agg(username, ', ') from keep_ids);
end $$;

-- Preview who will be removed (shown in Results)
select id, username, display_name
from public.profiles
where id not in (select id from keep_ids)
order by username;

-- Helper: delete only if table exists
create or replace function pg_temp.delete_if_exists(p_sql text)
returns void
language plpgsql
as $$
begin
  execute p_sql;
exception
  when undefined_table then
    raise notice 'Skipped missing table in: %', p_sql;
end;
$$;

select pg_temp.delete_if_exists($q$
  delete from public.message_likes
  where user_id not in (select id from keep_ids)
     or message_id in (
          select id from public.messages
          where sender_id not in (select id from keep_ids)
        )
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.messages
  where sender_id not in (select id from keep_ids)
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.chat_members
  where user_id not in (select id from keep_ids)
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.chats c
  where not exists (
    select 1 from public.chat_members m where m.chat_id = c.id
  )
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.posts
  where author_id not in (select id from keep_ids)
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.text_flags
  where user_id not in (select id from keep_ids)
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.user_restrictions
  where user_id not in (select id from keep_ids)
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.game_scores
  where user_id not in (select id from keep_ids)
$q$);

select pg_temp.delete_if_exists($q$
  delete from public.follows
  where follower_id not in (select id from keep_ids)
     or following_id not in (select id from keep_ids)
$q$);

-- Profiles (public)
delete from public.profiles
where id not in (select id from keep_ids);

-- Auth logins for removed kids (dashboard SQL can touch auth.users)
delete from auth.users
where id not in (select id from keep_ids);

-- Re-seat keepers in Everyone lounge room
do $$
declare
  lounge_id uuid;
begin
  select id into lounge_id from public.chats where lounge_key = 'everyone' limit 1;
  if lounge_id is null then
    insert into public.chats (is_group, title, created_by, lounge_key)
    values (
      true,
      'Everyone',
      (select id from keep_ids order by username limit 1),
      'everyone'
    )
    returning id into lounge_id;
  end if;

  insert into public.chat_members (chat_id, user_id)
  select lounge_id, k.id
  from keep_ids k
  on conflict (chat_id, user_id) do nothing;
exception
  when undefined_table then
    raise notice 'Lounge reseat skipped (chats/chat_members missing)';
  when undefined_column then
    raise notice 'Lounge reseat skipped (lounge_key missing — run sql-lounge-everyone.sql)';
end $$;

-- Final check
select 'kept_profiles' as kind, count(*)::int as n from public.profiles
union all
select 'kept_auth_users', count(*)::int from auth.users
union all
select 'remaining_posts', count(*)::int from public.posts;

commit;
