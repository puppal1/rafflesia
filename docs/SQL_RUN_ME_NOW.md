# Run these in Supabase SQL Editor (order matters)
<!-- created: 2026-11-23T20:47:00-08:00 -->
<!-- updated: 2026-11-24T13:35:00-08:00 — comment fix + reactions + comment media -->
<!-- project: btzgwfcnpnhtfnfxauqe -->

1. Open https://supabase.com/dashboard/project/btzgwfcnpnhtfnfxauqe/sql/new  
2. Paste **entire** [`sql-fix-comment-block-ambiguous.sql`](sql-fix-comment-block-ambiguous.sql) → **Run** ← **do this now** (fixes “block_post is ambiguous” + comment photos)  
3. Paste **entire** [`sql-content-reactions.sql`](sql-content-reactions.sql) → **Run** ← emoji likes on posts/comments  
4. If missing earlier: [`sql-post-comments.sql`](sql-post-comments.sql) then re-run step 2  
5. Siobhan comments: [`sql-news-comments.sql`](sql-news-comments.sql)  
6. Chat send fix if needed: [`sql-fix-send-chat-overload.sql`](sql-fix-send-chat-overload.sql)  
7. Hard refresh https://diyaanuppal.github.io/rafflesia-online/

**Unlocks:** For You comments · emoji likes · comment pictures · chat photo/link.
