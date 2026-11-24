-- created: 2026-11-23T12:28:00-08:00
-- repair missing profiles + ensure profile RLS allows own insert/update

-- 1) create a profile for every auth user that is missing one
insert into public.profiles (id, username, display_name, bio)
select
  u.id,
  lower(split_part(u.email, '@', 1)),
  split_part(u.email, '@', 1),
  ''
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
)
on conflict (id) do nothing;

-- 2) recreate profile policies cleanly
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
