-- created: 2026-11-24T21:55:00-08:00
-- Engaged Siobhan stories (commented or liked) — shared history across Chromebooks
-- Cap 50 by lowest (comments + reactions); list by engagement desc

create table if not exists public.news_story_history (
  article_key text primary key,
  title text not null,
  blurb text not null default '',
  tag text not null default '',
  emoji text not null default '📰',
  place text not null default '',
  source text not null default '',
  url text not null default '',
  fit_chips jsonb not null default '[]'::jsonb,
  published_at timestamptz,
  first_engaged_at timestamptz not null default now(),
  last_engaged_at timestamptz not null default now()
);

create index if not exists news_story_history_last_engaged_idx
  on public.news_story_history (last_engaged_at desc);

alter table public.news_story_history enable row level security;

drop policy if exists "news_story_history_select" on public.news_story_history;
create policy "news_story_history_select" on public.news_story_history
  for select to authenticated using (true);

-- Writes only via security definer RPCs
drop policy if exists "news_story_history_insert" on public.news_story_history;
drop policy if exists "news_story_history_update" on public.news_story_history;
drop policy if exists "news_story_history_delete" on public.news_story_history;

create or replace function public.news_story_engagement_score(p_article_key text)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce((
      select count(*)::int
      from public.news_comments c
      where c.article_key = p_article_key and c.deleted_at is null
    ), 0)
    +
    coalesce((
      select count(*)::int
      from public.news_reactions r
      where r.article_key = p_article_key
    ), 0);
$$;

create or replace function public.prune_news_story_history()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Keep top 50 by engagement score; drop lowest first
  delete from public.news_story_history h
  where h.article_key in (
    select x.article_key
    from (
      select
        article_key,
        public.news_story_engagement_score(article_key) as score,
        last_engaged_at
      from public.news_story_history
    ) x
    order by x.score asc, x.last_engaged_at asc
    offset 50
  );
end;
$$;

-- updated: 2026-11-24T22:08:00-08:00 — p_fit_chips as text (PostgREST-safe); drop old jsonb overload
drop function if exists public.touch_news_story_history(text, text, text, text, text, text, text, text, jsonb, timestamptz);

create or replace function public.touch_news_story_history(
  p_article_key text,
  p_title text,
  p_blurb text default '',
  p_tag text default '',
  p_emoji text default '📰',
  p_place text default '',
  p_source text default '',
  p_url text default '',
  p_fit_chips text default '[]',
  p_published_at timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  akey text := left(trim(coalesce(p_article_key, '')), 500);
  ttl text := left(trim(coalesce(p_title, '')), 300);
  chips jsonb;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  if akey = '' or ttl = '' then raise exception 'Missing story'; end if;

  begin
    chips := coalesce(nullif(trim(coalesce(p_fit_chips, '')), '')::jsonb, '[]'::jsonb);
  exception when others then
    chips := '[]'::jsonb;
  end;
  if jsonb_typeof(chips) is distinct from 'array' then
    chips := '[]'::jsonb;
  end if;

  insert into public.news_story_history (
    article_key, title, blurb, tag, emoji, place, source, url, fit_chips, published_at,
    first_engaged_at, last_engaged_at
  )
  values (
    akey,
    ttl,
    left(coalesce(p_blurb, ''), 500),
    left(coalesce(p_tag, ''), 80),
    left(coalesce(p_emoji, '📰'), 16),
    left(coalesce(p_place, ''), 120),
    left(coalesce(p_source, ''), 120),
    left(coalesce(p_url, ''), 2000),
    chips,
    p_published_at,
    now(),
    now()
  )
  on conflict (article_key) do update set
    title = excluded.title,
    blurb = excluded.blurb,
    tag = excluded.tag,
    emoji = excluded.emoji,
    place = excluded.place,
    source = excluded.source,
    url = excluded.url,
    fit_chips = excluded.fit_chips,
    published_at = coalesce(excluded.published_at, public.news_story_history.published_at),
    last_engaged_at = now();

  perform public.prune_news_story_history();
end;
$$;

create or replace function public.list_news_story_history(
  p_limit int default 10,
  p_offset int default 0
)
returns table (
  article_key text,
  title text,
  blurb text,
  tag text,
  emoji text,
  place text,
  source text,
  url text,
  fit_chips jsonb,
  published_at timestamptz,
  first_engaged_at timestamptz,
  last_engaged_at timestamptz,
  comment_count int,
  reaction_count int,
  engagement_score int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  lim int := greatest(1, least(coalesce(p_limit, 10), 20));
  off int := greatest(0, coalesce(p_offset, 0));
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;

  return query
  select
    h.article_key,
    h.title,
    h.blurb,
    h.tag,
    h.emoji,
    h.place,
    h.source,
    h.url,
    h.fit_chips,
    h.published_at,
    h.first_engaged_at,
    h.last_engaged_at,
    coalesce((
      select count(*)::int from public.news_comments c
      where c.article_key = h.article_key and c.deleted_at is null
    ), 0) as comment_count,
    coalesce((
      select count(*)::int from public.news_reactions r
      where r.article_key = h.article_key
    ), 0) as reaction_count,
    public.news_story_engagement_score(h.article_key) as engagement_score
  -- updated: 2026-11-24T22:20:00-08:00 — show all touched rows (table = engaged); score only sorts
  from public.news_story_history h
  order by
    public.news_story_engagement_score(h.article_key) desc,
    h.last_engaged_at desc
  limit lim
  offset off;
end;
$$;

create or replace function public.count_news_story_history()
returns integer
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;
  -- updated: 2026-11-24T22:20:00-08:00 — count every history row
  return (select count(*)::int from public.news_story_history);
end;
$$;

-- created: 2026-11-24T22:05:00-08:00 — seed history from likes/comments that predate the feature
create or replace function public.backfill_news_story_history()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
begin
  if auth.uid() is null then raise exception 'Not logged in'; end if;

  insert into public.news_story_history (
    article_key, title, blurb, tag, emoji, place, source, url, fit_chips, published_at,
    first_engaged_at, last_engaged_at
  )
  select
    k.article_key,
    'Story you engaged with',
    '',
    'Saved',
    '💬',
    '',
    '',
    '',
    '[]'::jsonb,
    null,
    coalesce(k.first_at, now()),
    coalesce(k.last_at, now())
  from (
    select
      article_key,
      min(created_at) as first_at,
      max(created_at) as last_at
    from (
      select article_key, created_at from public.news_comments where deleted_at is null
      union all
      select article_key, created_at from public.news_reactions
    ) u
    group by article_key
  ) k
  on conflict (article_key) do nothing;

  get diagnostics n = row_count;
  perform public.prune_news_story_history();
  return n;
end;
$$;

revoke all on function public.news_story_engagement_score(text) from public;
revoke all on function public.prune_news_story_history() from public;
revoke all on function public.touch_news_story_history(text, text, text, text, text, text, text, text, text, timestamptz) from public;
revoke all on function public.list_news_story_history(int, int) from public;
revoke all on function public.count_news_story_history() from public;
revoke all on function public.backfill_news_story_history() from public;

grant execute on function public.touch_news_story_history(text, text, text, text, text, text, text, text, text, timestamptz) to authenticated;
grant execute on function public.list_news_story_history(int, int) to authenticated;
grant execute on function public.count_news_story_history() to authenticated;
grant execute on function public.backfill_news_story_history() to authenticated;
