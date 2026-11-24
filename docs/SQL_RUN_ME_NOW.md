# Run these in Supabase SQL Editor (order matters)
<!-- created: 2026-11-23T20:47:00-08:00 -->
<!-- updated: 2026-11-24T00:05:00-08:00 — profile website links -->
<!-- updated: 2026-11-24T12:45:00-08:00 — PRD v2 consent / comments / announcements / delete account -->
<!-- updated: 2026-11-24T13:05:00-08:00 — fix send_chat_message overload -->
<!-- project: btzgwfcnpnhtfnfxauqe -->

1. Open https://supabase.com/dashboard/project/btzgwfcnpnhtfnfxauqe/sql/new  
2. Paste **entire** [`sql-fix-send-chat-overload.sql`](sql-fix-send-chat-overload.sql) → **Run** ← **do this now** (fixes Lounge/DM Send failed)  
3. If not done yet for v2: [`sql-consent-ledger.sql`](sql-consent-ledger.sql) → [`sql-post-comments.sql`](sql-post-comments.sql) → [`sql-announcements.sql`](sql-announcements.sql) → [`sql-delete-account.sql`](sql-delete-account.sql)  
4. Hard refresh https://diyaanuppal.github.io/rafflesia-online/

**What unlocked:** chat send works again · signup ToS ledger · post comments · delete own · Announcements · delete account.
