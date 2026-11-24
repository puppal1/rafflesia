-- created: 2026-11-23T22:25:00-08:00
-- Teacher soft-delete posts (hide offensive past content without hard wipe)

alter table public.posts
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_reason text;

create or replace function public.teacher_list_user_posts(p_password text, p_user_id uuid)
returns table (
  id uuid,
  author_id uuid,
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
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  return query
  select p.id, p.author_id, p.kind, p.body, p.media_url, p.created_at, p.deleted_at, p.deleted_reason
  from public.posts p
  where p.author_id = p_user_id
  order by p.created_at desc
  limit 100;
end;
$$;

create or replace function public.teacher_soft_delete_post(
  p_password text,
  p_post_id uuid,
  p_reason text default 'teacher moderation'
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
  update public.posts
    set deleted_at = now(),
        deleted_reason = coalesce(nullif(trim(p_reason), ''), 'teacher moderation')
  where id = p_post_id;
end;
$$;

create or replace function public.teacher_restore_post(p_password text, p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  update public.posts
    set deleted_at = null,
        deleted_reason = null
  where id = p_post_id;
end;
$$;

create or replace function public.teacher_soft_delete_user_posts(
  p_password text,
  p_user_id uuid,
  p_reason text default 'teacher moderation'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if not public.verify_teacher_password(p_password) then
    raise exception 'Wrong teacher password';
  end if;
  update public.posts
    set deleted_at = now(),
        deleted_reason = coalesce(nullif(trim(p_reason), ''), 'teacher moderation')
  where author_id = p_user_id
    and deleted_at is null;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.teacher_list_user_posts(text, uuid) from public;
revoke all on function public.teacher_soft_delete_post(text, uuid, text) from public;
revoke all on function public.teacher_restore_post(text, uuid) from public;
revoke all on function public.teacher_soft_delete_user_posts(text, uuid, text) from public;

grant execute on function public.teacher_list_user_posts(text, uuid) to authenticated, anon;
grant execute on function public.teacher_soft_delete_post(text, uuid, text) to authenticated, anon;
grant execute on function public.teacher_restore_post(text, uuid) to authenticated, anon;
grant execute on function public.teacher_soft_delete_user_posts(text, uuid, text) to authenticated, anon;
