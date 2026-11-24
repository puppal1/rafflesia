-- created: 2026-11-23T12:30:00-08:00
-- seed profiles + helper that creates YOUR profile while logged in

-- A) make profiles for every login account (run as dashboard = allowed)
insert into public.profiles (id, username, display_name, bio)
select
  u.id,
  lower(regexp_replace(split_part(coalesce(u.email, 'user'), '@', 1), '[^a-zA-Z0-9_]', '', 'g')),
  split_part(coalesce(u.email, 'Friend'), '@', 1),
  ''
from auth.users u
on conflict (id) do nothing;

-- B) helper: create/update my profile (uses auth.uid())
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

  uname := lower(regexp_replace(coalesce(nullif(p_username, ''), 'user'), '[^a-z0-9_]', '', 'g'));
  if uname = '' then
    uname := 'user' || substr(replace(uid::text, '-', ''), 1, 8);
  end if;
  dname := coalesce(nullif(p_display_name, ''), uname);

  insert into public.profiles (id, username, display_name, bio)
  values (uid, uname, dname, '')
  on conflict (id) do update
    set username = excluded.username,
        display_name = excluded.display_name
  returning * into rec;

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

  perform public.ensure_my_profile('user' || substr(replace(uid::text, '-', ''), 1, 8), 'Friend');

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

revoke all on function public.ensure_my_profile(text, text) from public;
revoke all on function public.set_my_profile_image(text, text) from public;
grant execute on function public.ensure_my_profile(text, text) to authenticated;
grant execute on function public.set_my_profile_image(text, text) to authenticated;

-- C) recreate basic profile policies
drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- D) quick check (should show numbers > 0 after this runs)
-- select (select count(*) from auth.users) as users, (select count(*) from public.profiles) as profiles;
