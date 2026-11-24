# Run these in Supabase SQL Editor (order matters)
<!-- created: 2026-11-23T20:47:00-08:00 -->
<!-- updated: 2026-11-24T13:50:00-08:00 — fix deleted_at missing on posts -->
<!-- project: btzgwfcnpnhtfnfxauqe -->

1. Open https://supabase.com/dashboard/project/btzgwfcnpnhtfnfxauqe/sql/new  
2. Paste **entire** [`sql-fix-comment-block-ambiguous.sql`](sql-fix-comment-block-ambiguous.sql) → **Run** ← **do this now**  
   (adds `posts.deleted_at` if missing · fixes comments · comment photos)  
3. Paste **entire** [`sql-content-reactions.sql`](sql-content-reactions.sql) → **Run** (emoji likes)  
4. Hard refresh https://diyaanuppal.github.io/rafflesia-online/

**Fixes:** `column p.deleted_at does not exist` · ambiguous `block_post` · For You comments.
