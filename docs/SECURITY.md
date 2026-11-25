# Rafflesia Online — security notes
<!-- created: 2026-11-24T22:50:00-08:00 -->
<!-- updated: 2026-11-24T22:50:00-08:00 -->

## Public vs private

| Surface | Visibility |
| --- | --- |
| GitHub source (`DiyaanUppal/rafflesia-online`, `puppal1/rafflesia`) | **Private** (required) |
| GitHub Pages (Chromebooks) | Public site; JS includes Supabase **anon** key |
| Supabase **service_role** | Never in repo, Pages, or client |
| Teacher password | **DB only** (`app_settings` / `verify_teacher_password`) — not in TSX |

The anon key in the built bundle is normal for a Supabase SPA. **RLS + Auth** protect data.

## Teacher console

- Client must not hardcode a fallback password.
- After any password was ever in git, **rotate** the DB teacher password in Supabase.
- Prefer changing it via SQL: update `app_settings` where key = `teacher_password`.

## School-site soft gate

- Preferred entry: `https://sites.google.com/opusd.us/…` (referrer / iframe).
- Classification is **soft** — Referer can be spoofed; we never claim proof.
- Lax challenge: off-site signup, or after several failed logins (math check; Turnstile later if `VITE_TURNSTILE_SITE_KEY` is set).
- DevTools: filter `[auth-entry]`.

## Content moderation

- Client: `checkKidText` (UX).
- Server: run [`sql-assert-kid-text.sql`](sql-assert-kid-text.sql) so `create_post` / `send_chat_message` call `assert_kid_text_allowed`.

## Rotate checklist

1. Supabase → rotate anon if leaked as service_role (anon already rotated 2026-11-23).
2. Update GitHub Actions secrets `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. Rotate teacher DB password.
4. Confirm both remotes are **private**.
