-- created: 2026-11-24T22:28:00-08:00
-- Wipe Siobhan “Stories we talked about” + feed likes/comments so history starts fresh.
-- (Old article_keys no longer match live cards after feed source changes.)

-- History stack
delete from public.news_story_history;

-- Engagement that would re-seed history via backfill
delete from public.news_reactions;
delete from public.news_comments;

-- Sanity counts (expect 0 / 0 / 0)
select
  (select count(*) from public.news_story_history) as history_rows,
  (select count(*) from public.news_reactions) as reaction_rows,
  (select count(*) from public.news_comments) as comment_rows;
