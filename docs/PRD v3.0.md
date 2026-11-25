# Rafflesia Online — Product Requirements (PRD v3.0)
<!-- created: 2026-11-25T01:20:00-08:00 — features shipped after PRD v2.0 -->
<!-- baseline: PRD.md (v1) · PRD v2.0.md (v2) · tasks: TASKS.md · security: SECURITY.md -->
<!-- audience: Diyaan (~10) + parent helper -->

**This file = everything implemented after v2 that is now product truth.**  
v1 stays in [`PRD.md`](PRD.md). v2 stays in [`PRD v2.0.md`](PRD%20v2.0.md).  
**Process:** wires before build for *new* surfaces ([`PRD.md`](PRD.md) §0).  
**Live kid URL (free GH):** `https://puppal1.github.io/rafflesia/` — Diyaan private source may 404 Pages until Pro.

---

## 0. What v3 adds (one screen)
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Area | Shipped in v3 |
|------|----------------|
| Safety / hosting | Soft school gate + captcha; private source; teacher DB password; server kid-text SQL; site-wide teacher post review; change passwords |
| Auth bots | Off-site login/signup challenge; teacher captcha always; Turnstile optional (Edge verify) |
| Siobhan Daily | Live 10-story feed, likes, comment dock, Stories history, timeouts / CORS fallbacks |
| Chat UX | ChatPanel rebuild; @mentions + soft Reply; private DMs stay out of bloom |
| Notifications | Jumping **dino** inbox; lounge/group/Announcements/social/teacher pins |
| Themes / icons | Theme **sheet** (tabs); faith symbols; furry character; faith/civic packs |
| Feed / people | Hide listed usernames; FYP polish; messaging UX fixes |

---

## 1. Product sentence (v3)
<!-- created: 2026-11-25T01:20:00-08:00 -->

**Rafflesia Online** is a pastel school club app: FYP + posts/comments, DMs + Lounge (Everyone / groups / Announcements), Siobhan Daily news, Me (themes, icons, password), a **dino notification inbox**, and a separate **teacher console** with site-wide moderation — entered preferably from the OPUSD Google Site, with soft off-site captcha.

---

# Phase D — Safety, hosting, auth (v3)
<!-- created: 2026-11-25T01:20:00-08:00 -->

## D1. Hosting & secrets
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Private source | Prefer private `DiyaanUppal/rafflesia-online` | **Done** |
| Public Pages | Free GH: Pages host (`puppal1/rafflesia`) stays **public** | **Done** |
| Anon key | Rotated; never ship `service_role` | **Done** |
| Teacher password | DB only (`app_settings` / `verify_teacher_password`); no client `teacher108` | **Done** |
| Docs | [`SECURITY.md`](SECURITY.md) | **Done** |

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [x] Kid URL works on puppal1 Pages  
- [x] Teacher login fails without DB password  
- [ ] Human: rotate teacher password if it was ever `teacher108`  

---

## D2. Soft school-site gate + captcha
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Classify | `school` vs `offsite` via referrer / iframe (`sites.google.com/opusd.us/`) | **Done** |
| Honest limit | Referer is **not** proof — soft signal only | **Done** |
| Off-site | Challenge on **login and signup** every time | **Done** |
| School | Challenge after **1** failed auth | **Done** |
| Fallback | Math check (weak vs AI) | **Done** |
| Strong path | Cloudflare Turnstile + Edge `verify-turnstile` when keys set | **Scaffolded** |
| Teacher | Captcha **always** on teacher console login | **Done** |

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [x] Direct github.io login shows bot check without a prior fail  
- [x] Teacher Enter console requires bot check  
- [ ] Optional: Turnstile site key + secret deployed (school may block CF)  

---

## D3. Server-side kid text
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| SQL | `assert_kid_text_allowed` on create_post / send_chat_message | **SQL shipped** |
| Client | `checkKidText` remains UX layer | **Done** |

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [ ] Human confirms `sql-assert-kid-text.sql` (or docs copy) applied in Supabase  

---

## D4. Teacher console — posts + password
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Site-wide posts | Recent feed + keyword search + optional student filter | **Done** |
| Soft-delete | Hide / restore / hide-all for one student | **Done** |
| Not gated | Posts tab works without Restrict pick first | **Done** |
| Change teacher PW | Overview → change password RPC | **Done** |
| SQL | `teacher-moderation-posts.sql`, `teacher-posts-overview.sql`, `teacher-change-password.sql` | **Shipped** |

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [x] Teacher can browse all recent posts without picking a student first  
- [x] Search + filter + hide/restore  
- [ ] Human: run overview + change-password SQL if not already  

---

## D5. Change password (kids)
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Me | Current + new + confirm → re-auth then `updateUser` | **Done** |
| Min length | ≥ 6 (Auth) | **Done** |

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [x] Kid can change password from Me without teacher  

---

## D6. Messaging bugfix (profile stuck)
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| startDm | Close profile so Messages tab shows | **Done** |
| Label | Button shows Messaging… while busy | **Done** |

---

# Phase E — Siobhan Daily (v3 depth)
<!-- created: 2026-11-25T01:20:00-08:00 -->

v2 shipped the page; v3 makes it a real club paper.

| Requirement | Detail | Status |
|-------------|--------|--------|
| Live feed | ~10 stories; bands local/env/science; SPACE_MAX | **Done** |
| Weather | Open-Meteo Oak Park card | **Done** |
| Robust fetch | Timeouts; allorigins / publishers; drop flaky Google News | **Done** |
| Likes | Emoji reactions on stories | **Done** |
| Comments | Side/bottom dock; counts; timestamps | **Done** |
| Stories history | Liked/commented → “Stories we talked about”; SQL + RT ping | **Done** |
| Clear history | SQL wipe script for fresh start | **Done** |
| UX | Refresh near Live status; calmer cards | **Done** |

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [x] Feed loads without infinite spinner  
- [x] Like/comment updates history across browsers after SQL  
- [ ] Human: `sql-news-story-history.sql` applied  

---

# Phase F — Chat & mentions
<!-- created: 2026-11-25T01:20:00-08:00 -->

## F1. ChatPanel rebuild
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| UX | One stream scroll; bubbles don’t nest-scroll | **Done** |
| Media | Photo attach + enlarge; no overlapping Remove | **Done** |
| Inbox | Scrollable friends list | **Done** |

## F2. @mentions + soft Reply
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Autocomplete | `@` in chat + CommentComposer | **Done** |
| Highlight | Known/unknown `@handle` underlined + tappable | **Done** |
| Soft Reply | Seeds `@author` (no nested threads) | **Done** |
| Profile | Tap mention opens profile (DB lookup if needed) | **Done** |

**Out of scope v3:** nested reply trees / full mention picker product.

---

# Phase G — Notifications (dino inbox)
<!-- created: 2026-11-25T01:20:00-08:00 -->

## G1. Bloom → dino control
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Placement | Header left of Log out | **Done** |
| Icon | 🦕 idle; **jumps** + badge when unread | **Done** |
| Modal | “What’s new” — teacher pins on top | **Done** |
| Mark read | On **close** (rows visible first) | **Done** |
| Poll | ~8s + realtime if publication enabled | **Done** |

## G2. What notifies (locked)
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Type | When | Status |
|------|------|--------|
| `teacher_restrict` / `teacher_verify` | Teacher actions — **pinned** | **Done** |
| `announcement` | `@rafflesiaonline` in Announcements lounge | **Done** |
| `chat_mention` | `@you` in lounge / **group** (not private DM) | **Done** |
| `chat_message` | Named **group** chat (not private DM, not Everyone flood) | **Done** |
| `post_reaction` / `post_comment` / `post_comment_followup` | Social on posts | **Done** |
| `follow` | Someone follows you | **Done** |
| `news_story_reaction` | React to Siobhan story you commented on | **Done** |
| **Private DMs** | **Never** bloom — Messages tab only | **Done** |

**SQL:** `sql/notifications.sql` + `sql/notifications-message-trigger-fix.sql`

**Acceptance**
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [x] Dino jumps with unread  
- [x] DM does not fill inbox  
- [x] Lounge `@mention` / group / Announcements / social / teacher appear  
- [ ] Human: notifications SQL applied  

---

# Phase H — Themes & icons (v3)
<!-- created: 2026-11-25T01:20:00-08:00 -->

## H1. Theme sheet UX
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Open | Modal/sheet — not endless inline accordion | **Done** |
| Sticky | **Auto** + **Done** always visible | **Done** |
| Tabs | Colors · Scenes · Chars · Faith · Civic | **Done** |

## H2. Faith symbols + furry
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Asset | Use | Status |
|-------|-----|--------|
| Om / Aum, Cross, Star of David, Khanda (Sikh), Dharma wheel, Crescent | Faith icons + theme BGs | **Done** |
| Lotus / candle / dove | Kept | **Done** |
| Furry Fox | Character icon + theme BG | **Done** |
| Faith / civic manga packs | Icon picker | **Done** (v2 late → v3 inventory) |

---

# Phase I — Feed / people polish
<!-- created: 2026-11-25T01:20:00-08:00 -->

| Requirement | Detail | Status |
|-------------|--------|--------|
| Hidden users | Config list hidden from People / FYP / search / DM | **Done** |
| FYP media | Larger images; tap-to-enlarge | **Done** |
| Reactions | Content reactions on posts/comments | **Done** (v2/v3 boundary) |

---

## 2. Human SQL checklist (v3)
<!-- created: 2026-11-25T01:20:00-08:00 -->

Run in Supabase if not already (order flexible if prior patches applied):

1. `sql-assert-kid-text.sql` / `docs/sql-assert-kid-text.sql`  
2. `sql/teacher-moderation-posts.sql`  
3. `sql/teacher-posts-overview.sql`  
4. `sql/teacher-change-password.sql`  
5. `sql/notifications.sql`  
6. `sql/notifications-message-trigger-fix.sql` (DM exclusion + mention rules)  
7. Siobhan: `docs/sql-news-story-history.sql` (+ comments/reactions if missing)  

Optional AI captcha: Turnstile keys + `supabase/functions/verify-turnstile`.

---

## 3. Out of scope / later
<!-- created: 2026-11-25T01:20:00-08:00 -->

- Nested comment reply threads  
- Browser push notifications  
- Trusting Referer as hard school firewall  
- Private repo + Pages on free GitHub (needs Pro)  
- Relying on Turnstile on OPUSD network (often blocked)  

---

## 4. Related docs
<!-- created: 2026-11-25T01:20:00-08:00 -->

- [`PRD.md`](PRD.md) · [`PRD v2.0.md`](PRD%20v2.0.md) · [`SECURITY.md`](SECURITY.md) · [`TASKS.md`](TASKS.md)  
- Plans: `rafflesia_mentions_first`, `rafflesia_notifications_inbox`, `public_repo_security_*`  
