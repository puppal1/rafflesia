# Run these in Supabase SQL Editor (order matters)
<!-- created: 2026-11-23T20:47:00-08:00 -->
<!-- project: btzgwfcnpnhtfnfxauqe -->

1. Open https://supabase.com/dashboard/project/btzgwfcnpnhtfnfxauqe/sql/new  
2. Paste **entire** `fix-follows-rls.sql` → **Run**  
3. Paste **entire** `fix-group-members.sql` → **Run**  
4. Optional: `enable-realtime-messages.sql` → **Run**  
5. Hard refresh https://diyaanuppal.github.io/rafflesia-online/

| File | Unlocks |
|------|---------|
| `fix-follows-rls.sql` | Follow counts + lists cross-users |
| `fix-group-members.sql` | Create group with friends + Add friends + shared groups |
| `enable-realtime-messages.sql` | Faster chat push (poll already works) |
