# Run these in Supabase SQL Editor (order matters)
<!-- created: 2026-11-23T20:47:00-08:00 -->
<!-- updated: 2026-11-24T22:08:00-08:00 — news story history + backfill -->
<!-- project: btzgwfcnpnhtfnfxauqe -->

1. Open https://supabase.com/dashboard/project/btzgwfcnpnhtfnfxauqe/sql/new  
2. Paste **entire** [`sql-news-story-history.sql`](sql-news-story-history.sql) → **Run** ← **Stories we talked about** (touch + list + backfill)  
3. Hard refresh https://diyaanuppal.github.io/rafflesia-online/

**Fixes:** empty history after like/comment · Chromebook / new browser · stack not updating live.

Already applied earlier? Still re-run step 2 — it adds `backfill_news_story_history` and a safer `touch_news_story_history`.
