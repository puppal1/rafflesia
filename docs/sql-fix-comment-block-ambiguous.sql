-- created: 2026-11-24T13:35:00-08:00
-- Fix: column reference "block_post" is ambiguous in create_post_comment
-- Also adds comment media_url for picture comments

alter table public.post_comments
  add column if not exists media_url text;

create or replace function public.create_post_comment(
  p_post_id uuid,
  p_body text,
  p_media_url text default null
)
returns public.post_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  rec public.post_comments;
  post_ok boolean;
  v_block_post boolean := false;
  v_block_msg boolean := false;
  body text := trim(coalesce(p_body, ''));
  media text := nullif(trim(coalesce(p_media_url, '')), '');
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if body = '' and media is null then raise exception 'Write a comment or add a picture.'; end if;
  if char_length(body) > 500 then raise exception 'Comment is too long.'; end if;

  if to_regclass('public.user_restrictions') is not null then
    select coalesce(ur.block_post, false), coalesce(ur.block_message, false)
      into v_block_post, v_block_msg
    from public.user_restrictions ur
    where ur.user_id = uid;
  end if;
  if v_block_post or v_block_msg then
    raise exception 'Commenting is restricted by a teacher';
  end if;

  select exists(select 1 from public.posts p where p.id = p_post_id and p.deleted_at is null)
    into post_ok;
  if not coalesce(post_ok, false) then
    -- older DBs without deleted_at
    select exists(select 1 from public.posts p where p.id = p_post_id) into post_ok;
  end if;
  if not post_ok then raise exception 'Post not found.'; end if;

  insert into public.post_comments (post_id, author_id, body, media_url)
  values (p_post_id, uid, case when body = '' then '📷' else body end, media)
  returning * into rec;
  return rec;
end;
$$;

revoke all on function public.create_post_comment(uuid, text) from public;
revoke all on function public.create_post_comment(uuid, text, text) from public;
drop function if exists public.create_post_comment(uuid, text);
grant execute on function public.create_post_comment(uuid, text, text) to authenticated;
