-- created: 2026-11-23T20:22:00-08:00
-- updated: 2026-11-23T20:40:00-08:00 — re-engineer follows: public read + count RPCs
-- RUN ONCE in Supabase → SQL Editor → paste all → Run

alter table public.follows enable row level security;

drop policy if exists "follows_select_own" on public.follows;
drop policy if exists "follows_select_all" on public.follows;
drop policy if exists "follows_insert_own" on public.follows;
drop policy if exists "follows_delete_own" on public.follows;
drop policy if exists follows_select on public.follows;
drop policy if exists follows_insert on public.follows;
drop policy if exists follows_delete on public.follows;

-- Every logged-in kid can read the whole follow graph (counts + lists)
create policy "follows_select_all"
  on public.follows
  for select
  to authenticated
  using (true);

create policy "follows_insert_own"
  on public.follows
  for insert
  to authenticated
  with check (follower_id = auth.uid());

create policy "follows_delete_own"
  on public.follows
  for delete
  to authenticated
  using (follower_id = auth.uid());

-- Toggle follow / unfollow
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

  begin
    insert into public.follows (follower_id, following_id)
    values (uid, p_other_user_id);
  exception
    when unique_violation then
      null;
  end;
  return 'followed';
end;
$$;

create unique index if not exists follows_follower_following_uidx
  on public.follows (follower_id, following_id);

-- Ids I follow (button state)
create or replace function public.list_my_following()
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
  select coalesce(array_agg(following_id), '{}'::uuid[])
    into ids
  from public.follows
  where follower_id = uid;
  return ids;
end;
$$;

-- Bulk counts for People list (one round trip)
create or replace function public.get_follow_counts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  return coalesce(
    (
      select jsonb_object_agg(pid, jsonb_build_object('followers', fol, 'following', fing))
      from (
        select
          p.id as pid,
          (select count(*)::int from public.follows f where f.following_id = p.id) as fol,
          (select count(*)::int from public.follows f where f.follower_id = p.id) as fing
        from public.profiles p
      ) s
    ),
    '{}'::jsonb
  );
end;
$$;

create or replace function public.list_user_following(p_user_id uuid)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  return query
  select p.*
  from public.follows f
  join public.profiles p on p.id = f.following_id
  where f.follower_id = p_user_id
  order by lower(p.username);
end;
$$;

create or replace function public.list_user_followers(p_user_id uuid)
returns setof public.profiles
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not logged in';
  end if;
  return query
  select p.*
  from public.follows f
  join public.profiles p on p.id = f.follower_id
  where f.following_id = p_user_id
  order by lower(p.username);
end;
$$;

revoke all on function public.toggle_follow(uuid) from public;
revoke all on function public.list_my_following() from public;
revoke all on function public.get_follow_counts() from public;
revoke all on function public.list_user_following(uuid) from public;
revoke all on function public.list_user_followers(uuid) from public;
grant execute on function public.toggle_follow(uuid) to authenticated;
grant execute on function public.list_my_following() to authenticated;
grant execute on function public.get_follow_counts() to authenticated;
grant execute on function public.list_user_following(uuid) to authenticated;
grant execute on function public.list_user_followers(uuid) to authenticated;
