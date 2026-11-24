-- created: 2026-11-24T13:25:00-08:00
-- updated: 2026-11-24T14:05:00-08:00 — media_url for standard comment panel (photo)
-- Siobhan Daily / news feed comments (keyed by article_key, not posts.id)

create table if not exists public.news_comments (
  id uuid primary key default gen_random_uuid(),
  article_key text not null,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_reason text
);

alter table public.news_comments
  add column if not exists media_url text;

create index if not exists news_comments_article_idx
  on public.news_comments (article_key, created_at)
  where deleted_at is null;

alter table public.news_comments enable row level security;

drop policy if exists "news_comments_select" on public.news_comments;
create policy "news_comments_select" on public.news_comments
  for select to authenticated
  using (deleted_at is null);

drop policy if exists "news_comments_insert_own" on public.news_comments;
create policy "news_comments_insert_own" on public.news_comments
  for insert to authenticated
  with check (author_id = auth.uid());

drop function if exists public.create_news_comment(text, text);
drop function if exists public.create_news_comment(text, text, text);

create or replace function public.create_news_comment(
  p_article_key text,
  p_body text,
  p_media_url text default null
)
returns public.news_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  body text := trim(coalesce(p_body, ''));
  key text := trim(coalesce(p_article_key, ''));
  media text := nullif(trim(coalesce(p_media_url, '')), '');
  rec public.news_comments;
  v_block_msg boolean := false;
begin
  if uid is null then raise exception 'Not logged in'; end if;
  if key = '' then raise exception 'Missing article'; end if;
  if char_length(key) > 500 then raise exception 'Article key too long'; end if;
  if body = '' and media is null then raise exception 'Write a comment or add a picture.'; end if;
  if char_length(body) > 800 then raise exception 'Comment too long'; end if;

  if to_regclass('public.user_restrictions') is not null then
    select coalesce(ur.block_message, false)
      into v_block_msg
    from public.user_restrictions ur
    where ur.user_id = uid;
  end if;
  if v_block_msg then
    raise exception 'Messaging is restricted by a teacher';
  end if;

  insert into public.news_comments (article_key, author_id, body, media_url)
  values (key, uid, case when body = '' then '📷' else body end, media)
  returning * into rec;
  return rec;
end;
$$;

create or replace function public.soft_delete_my_news_comment(p_comment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not logged in'; end if;
  update public.news_comments
    set deleted_at = now(), deleted_reason = 'author delete'
  where id = p_comment_id and author_id = uid and deleted_at is null;
end;
$$;

revoke all on function public.create_news_comment(text, text, text) from public;
revoke all on function public.soft_delete_my_news_comment(uuid) from public;
grant execute on function public.create_news_comment(text, text, text) to authenticated;
grant execute on function public.soft_delete_my_news_comment(uuid) to authenticated;
