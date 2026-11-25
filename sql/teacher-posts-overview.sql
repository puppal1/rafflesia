-- created: 2026-11-24T23:50:00-08:00
-- Site-wide post review for teachers (timeline + keyword search). Run in Supabase after teacher-moderation-posts.sql.

create or replace function public.teacher_list_recent_posts(
  p_password text,
  p_limit integer default 80,
  p_author_id uuid default null
)
returns table (
  id uuid,
  author_id uuid,
  username text,
  display_name text,
  kind text,
  body text,
  media_url text,
  created_at timestamptz,
  deleted_at timestamptz,
  deleted_reason text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- created: 2026-11-24T23:50:00-08:00
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  return query
  select
    p.id,
    p.author_id,
    coalesce(pr.username, '?')::text,
    coalesce(pr.display_name, '')::text,
    p.kind,
    p.body,
    p.media_url,
    p.created_at,
    p.deleted_at,
    p.deleted_reason
  from public.posts p
  left join public.profiles pr on pr.id = p.author_id
  where (p_author_id is null or p.author_id = p_author_id)
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 80), 200));
end;
$$;

create or replace function public.teacher_search_posts(
  p_password text,
  p_query text,
  p_limit integer default 80
)
returns table (
  id uuid,
  author_id uuid,
  username text,
  display_name text,
  kind text,
  body text,
  media_url text,
  created_at timestamptz,
  deleted_at timestamptz,
  deleted_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  q text := lower(trim(coalesce(p_query, '')));
begin
  -- created: 2026-11-24T23:50:00-08:00
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  if length(q) < 1 then
    return;
  end if;
  return query
  select
    p.id,
    p.author_id,
    coalesce(pr.username, '?')::text,
    coalesce(pr.display_name, '')::text,
    p.kind,
    p.body,
    p.media_url,
    p.created_at,
    p.deleted_at,
    p.deleted_reason
  from public.posts p
  left join public.profiles pr on pr.id = p.author_id
  where
    lower(coalesce(p.body, '')) like '%' || q || '%'
    or lower(coalesce(pr.username, '')) like '%' || q || '%'
    or lower(coalesce(pr.display_name, '')) like '%' || q || '%'
  order by p.created_at desc
  limit greatest(1, least(coalesce(p_limit, 80), 200));
end;
$$;

revoke all on function public.teacher_list_recent_posts(text, integer, uuid) from public;
revoke all on function public.teacher_search_posts(text, text, integer) from public;

grant execute on function public.teacher_list_recent_posts(text, integer, uuid) to authenticated, anon;
grant execute on function public.teacher_search_posts(text, text, integer) to authenticated, anon;
