-- created: 2026-11-23T20:22:00-08:00
-- Fix Follow/Unfollow UI: follows rows were written by toggle_follow but
-- SELECT RLS returned [] so the button never flipped to Unfollow.

alter table public.follows enable row level security;

drop policy if exists "follows_select_own" on public.follows;
drop policy if exists "follows_insert_own" on public.follows;
drop policy if exists "follows_delete_own" on public.follows;
drop policy if exists follows_select on public.follows;
drop policy if exists follows_insert on public.follows;
drop policy if exists follows_delete on public.follows;

-- See who I follow and who follows me
create policy "follows_select_own"
  on public.follows
  for select
  to authenticated
  using (follower_id = auth.uid() or following_id = auth.uid());

-- Optional direct writes (RPC still preferred)
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

-- Belt-and-suspenders: list following via security definer (works even if RLS tight)
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

revoke all on function public.list_my_following() from public;
grant execute on function public.list_my_following() to authenticated;

-- Ensure toggle_follow exists (idempotent)
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

revoke all on function public.toggle_follow(uuid) from public;
grant execute on function public.toggle_follow(uuid) to authenticated;
