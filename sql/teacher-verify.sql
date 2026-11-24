-- created: 2026-11-23T23:35:00-08:00
-- updated: 2026-11-23T23:40:00-08:00 — DROP teacher_search_users before return-type change
-- Teacher-only verification badges: pink | gold | blue

alter table public.profiles
  add column if not exists verify_tier text;

alter table public.profiles
  drop constraint if exists profiles_verify_tier_check;

alter table public.profiles
  add constraint profiles_verify_tier_check
  check (verify_tier is null or verify_tier in ('pink', 'gold', 'blue'));

-- Kids cannot self-assign verify_tier; teacher RPC sets a session flag
create or replace function public.protect_verify_tier()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if current_setting('app.allow_verify_change', true) is distinct from 'on' then
      new.verify_tier := null;
    end if;
    return new;
  end if;
  if new.verify_tier is distinct from old.verify_tier then
    if current_setting('app.allow_verify_change', true) is distinct from 'on' then
      new.verify_tier := old.verify_tier;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_verify_tier on public.profiles;
create trigger trg_protect_verify_tier
  before insert or update on public.profiles
  for each row
  execute function public.protect_verify_tier();

create or replace function public.teacher_set_verify(
  p_password text,
  p_user_id uuid,
  p_tier text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  tier text := nullif(lower(trim(coalesce(p_tier, ''))), '');
  rec public.profiles;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  if tier is not null and tier not in ('pink', 'gold', 'blue') then
    raise exception 'Tier must be pink, gold, blue, or blank to remove';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User not found';
  end if;

  perform set_config('app.allow_verify_change', 'on', true);

  update public.profiles
    set verify_tier = tier
  where id = p_user_id
  returning * into rec;

  return rec;
end;
$$;

-- Refresh search to include verify_tier (must DROP — OUT row type changed)
drop function if exists public.teacher_search_users(text, text);

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
  block_message boolean,
  verify_tier text
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
    coalesce(r.block_message, false),
    p.verify_tier
  from public.profiles p
  left join public.user_restrictions r on r.user_id = p.id
  where p.username ilike '%' || q || '%'
     or p.display_name ilike '%' || q || '%'
  order by p.username
  limit 20;
end;
$$;

revoke all on function public.teacher_set_verify(text, uuid, text) from public;
revoke all on function public.teacher_search_users(text, text) from public;
grant execute on function public.teacher_set_verify(text, uuid, text) to authenticated, anon;
grant execute on function public.teacher_search_users(text, text) to authenticated, anon;
