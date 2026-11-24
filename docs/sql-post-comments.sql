-- created: 2026-11-24T12:35:00-08:00
-- updated: 2026-11-24T13:30:00-08:00 — safer restrictions + posts without deleted_at
-- PRD v2 B2 / B2b: post comments + own soft-delete
-- RUN THIS in Supabase SQL Editor for For You comments to work

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_reason text
);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);
alter table public.post_comments enable row level security;

drop policy if exists "post_comments_select" on public.post_comments;
create policy "post_comments_select" on public.post_comments for select to authenticated
  using (deleted_at is null);

drop policy if exists "post_comments_insert_own" on public.post_comments;
create policy "post_comments_insert_own" on public.post_comments for insert to authenticated
  with check (author_id = auth.uid());

create or replace function public.create_post_comment(p_post_id uuid, p_body text)
returns public.post_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.post_comments;
  post_ok boolean;
  block_post boolean := false;
  block_msg boolean := false;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if length(trim(coalesce(p_body, ''))) = 0 then raise exception 'Write a comment.'; end if;
  if length(trim(p_body)) > 500 then raise exception 'Comment is too long.'; end if;

  if to_regclass('public.user_restrictions') is not null then
    select coalesce(block_post, false), coalesce(block_message, false)
      into block_post, block_msg
    from public.user_restrictions
    where user_id = uid;
  end if;
  if coalesce(block_post, false) or coalesce(block_msg, false) then
    raise exception 'Commenting is restricted by a teacher';
  end if;

  select exists(select 1 from public.posts p where p.id = p_post_id) into post_ok;
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'deleted_at'
  ) then
    select exists(
      select 1 from public.posts p where p.id = p_post_id and p.deleted_at is null
    ) into post_ok;
  end if;
  if not post_ok then raise exception 'Post not found.'; end if;
  insert into public.post_comments (post_id, author_id, body)
  values (p_post_id, uid, trim(p_body))
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.soft_delete_my_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not logged in'; end if;
  update public.post_comments
    set deleted_at = now(), deleted_reason = 'author delete'
  where id = p_comment_id and author_id = uid and deleted_at is null;
end;
$$;

create or replace function public.soft_delete_my_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not logged in'; end if;
  update public.posts
    set deleted_at = now(), deleted_reason = 'author delete'
  where id = p_post_id and author_id = uid and deleted_at is null;
  update public.post_comments
    set deleted_at = now(), deleted_reason = 'parent post deleted'
  where post_id = p_post_id and deleted_at is null;
end;
$$;

create or replace function public.teacher_soft_delete_comment(
  p_password text,
  p_comment_id uuid,
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
  update public.post_comments
    set deleted_at = now(), deleted_reason = p_reason
  where id = p_comment_id and deleted_at is null;
end;
$$;

revoke all on function public.create_post_comment(uuid, text) from public;
revoke all on function public.soft_delete_my_comment(uuid) from public;
revoke all on function public.soft_delete_my_post(uuid) from public;
revoke all on function public.teacher_soft_delete_comment(text, uuid, text) from public;
grant execute on function public.create_post_comment(uuid, text) to authenticated;
grant execute on function public.soft_delete_my_comment(uuid) to authenticated;
grant execute on function public.soft_delete_my_post(uuid) to authenticated;
grant execute on function public.teacher_soft_delete_comment(text, uuid, text) to authenticated, anon;
