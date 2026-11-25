# Rafflesia Online — security notes
<!-- created: 2026-11-24T22:50:00-08:00 -->
<!-- updated: 2026-11-24T23:40:00-08:00 — login always challenged off-site; Turnstile Edge verify -->
<!-- updated: 2026-11-24T23:55:00-08:00 — teacher captcha always; Me + teacher change password; site-wide posts -->

## Public vs private

| Surface | Visibility |
| --- | --- |
| GitHub source (`DiyaanUppal/rafflesia-online`) | **Private** (recommended) |
| Pages host (`puppal1/rafflesia`) | Must stay **public** on free GitHub — private repos cannot serve Pages |
| Chromebook URL | Prefer `https://puppal1.github.io/rafflesia/` while Diyaan repo is private |
| `diyaanuppal.github.io/rafflesia-online` | 404 while that repo is private (needs GitHub Pro for private+Pages) |
| Supabase **service_role** | Never in repo, Pages, or client |
| Teacher password | **DB only** (`app_settings` / `verify_teacher_password`) — not in TSX |

The anon key in the built bundle is normal for a Supabase SPA. **RLS + Auth** protect data.

## Teacher console

- Client must not hardcode a fallback password.
- After any password was ever in git, **rotate** the DB teacher password in Supabase.
- Prefer **Overview → Change teacher password** (needs `sql/teacher-change-password.sql`), or SQL: update `app_settings` where key = `teacher_password`.
- Teacher login always requires the bot check (math / Turnstile).
- Kids change their own password under **Me → Change password**.

## School-site soft gate + bot check

- Preferred entry: `https://sites.google.com/opusd.us/…` (referrer / iframe).
- Classification is **soft** — Referer can be spoofed; we never claim proof.
- **Off-site (direct github.io):** challenge on **login and signup** every time.
- **School referrer:** challenge after **1** failed auth attempt.
- Math question is a **soft fallback only** (AI can solve it).
- **Cloudflare Turnstile** (recommended vs AI):
  1. Create a Turnstile widget for `puppal1.github.io`.
  2. Set GitHub Actions / `.env.local` `VITE_TURNSTILE_SITE_KEY=<site key>`.
  3. Deploy Edge Function: `supabase functions deploy verify-turnstile`.
  4. `supabase secrets set TURNSTILE_SECRET_KEY=<secret key>`.
- DevTools: filter `[auth-entry]`.

## Content moderation

- Client: `checkKidText` (UX).
- Server: run [`sql-assert-kid-text.sql`](sql-assert-kid-text.sql) so `create_post` / `send_chat_message` call `assert_kid_text_allowed`.

## Rotate checklist

1. Supabase → rotate anon if leaked as service_role (anon already rotated 2026-11-23).
2. Update GitHub Actions secrets `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (and `VITE_TURNSTILE_SITE_KEY` when ready).
3. Rotate teacher DB password.
4. Confirm Diyaan source remote is **private**; Pages host may stay public on free GitHub.
