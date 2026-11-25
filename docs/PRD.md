# Rafflesia Online — Product Requirements (PRD v1.0)
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- version: 1.0 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — backfill v1.0 shipped features from build arc -->
<!-- updated: 2026-11-24T12:10:00-08:00 — v2 features moved to PRD v2.0.md -->
<!-- updated: 2026-11-25T01:20:00-08:00 — post-v2 work lives in PRD v3.0.md -->
<!-- new features: PRD v2.0.md · PRD v3.0.md · tech: TECH.md · screens: SCREEN_MAP.md · tasks: TASKS.md -->
<!-- audience: Diyaan (~10) + parent helper -->

---

## 0. How we work (process lock)
<!-- created: 2026-11-23T19:46:00-08:00 -->
<!-- updated: 2026-11-24T11:55:00-08:00 — still wires-before-build for new v2 surfaces -->

| Step | Deliverable | Rule |
|------|-------------|------|
| 1 | Screen map | [`SCREEN_MAP.md`](SCREEN_MAP.md) — inventory before drawing |
| 2 | **Wireframes + UX** | **Required** before new feature build; first-cut wires first |
| 3 | Build | Code against locked wires |
| 4 | School door | Google Sites embed only (see [`TECH.md`](TECH.md) §6) |

Task tracker: [`TASKS.md`](TASKS.md).  
Human QC / phase test cases: [`QC.md`](QC.md).

**v1 first-cut wire set:** Auth A1–A4, shell B1, Messages D1–D5, People/Me E1–E5, Teacher G1–G5.  
**v1 late (built — documented in §5):** Intro video, Lounge/Everyone, teacher soft-delete + verify, right rail, website links, themes + lock, emoji-only icons, header Log out.  
**v2 features:** [`PRD v2.0.md`](PRD%20v2.0.md) — FYP, Announcements, manga BGs, Siobhan page, ToS, named colors.  
**v3 features:** [`PRD v3.0.md`](PRD%20v3.0.md) — safety/captcha, Siobhan depth, mentions, dino notifications, theme sheet, faith/furry.

---

## 1. Product in one sentence
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — match shipped v1 + v2 target -->

**Rafflesia Online** is a pastel, kid-friendly club for **Rafflesia Channel Entertainment** — Home posts, DMs + Lounge (Everyone + groups), profiles with badges/links, teacher safety tools, intro video, and themes.  
New work lives in [`PRD v2.0.md`](PRD%20v2.0.md).

---

## 2. Who it is for
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — official club account -->

- Middle-school kids (Diyaan and friends first)
- Home + school Chromebook via Google Sites door
- Teachers use a **separate** moderation console
- Official club account **`@rafflesiaonline`** for announcements (v2 ACL) and club presence
- Keeper accounts for resets: **`@diyaan`**, **`@rafflesiaonline`** (wipe SQL keeps these)
- Not App Store apps in Phase 1 / v2

---

## 3. vs Gotcha — parity + more
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — Home still v1; FYP is v2 -->

### 3.1 Gotcha parity (must match)
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 -->

| Gotcha | Rafflesia |
|--------|-----------|
| LOG IN / CREATE ACCOUNT (username + password) | Same — no email box (ToS checkbox → v2) |
| HOME feed | Home (following + own). FYP → [`PRD v2.0.md`](PRD%20v2.0.md) |
| + POST → Video / Link / Picture | Create post: video, link, picture, **text**; upload or paste URL |
| TEXT (messages) | **DMs** under Messages; **Lounge** for Everyone + groups |
| Profile: pic, banner, bio, followers, posts | Full profile + Edit + website links + verify badge |
| Followers count | Follow / unfollow + count + lists |

### 3.2 Rafflesia “+ more”
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — ship notes -->

| Idea | Kid / teacher experience | v1 status |
|------|--------------------------|-----------|
| Fun icon library at signup | Emoji pack icons (dino / flower / space / snack / sport) | **Shipped** (emoji-only; PNG backlog) |
| Icon matches | Same-pack friend cues under People / PlayHub | **Shipped** |
| Lounge | Groups + club room **Everyone** | **Shipped** |
| Announcements ACL / FYP / Siobhan / ToS / manga BGs | See [`PRD v2.0.md`](PRD%20v2.0.md) | **v2** |
| Safety | Text checker + teacher console + soft-delete + verify | **Shipped** |
| Look | Multi-theme pastels + picker + hourly auto (with lock) | **Shipped** (12 pastels) |
| Intro | Full-screen club intro video before login | **Shipped** |

---

## 4. Hard product rules
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — lock + soft-delete + Lounge rules -->

| Rule | Meaning |
|------|---------|
| Money | Free only — no paywalls for kids |
| Login kids see | Username + display name + password + icon pick (no email) |
| School door | Share **Google Sites** link only — never raw github.io as the kid door |
| Safety | Auto text check + teacher console; report path may expose chats |
| Soft-delete ≠ restrict | Restrict blocks *new* post/message; teacher **soft-delete** hides existing offensive posts from Home |
| Verify | Teacher-only pink / gold / blue badges — kids cannot self-assign |
| Everyone | Club lounge room for all members — **not** a private friend group chat |
| Logout | **Log out always visible** in the header on every kid page (compact) |
| Header identity | Corner control is **profile face** → opens Me (not a dead logo) |
| Themes | Auto hourly rotation **or** user pick; **user pick locks** (no auto-rotate until Auto) |
| UX lock | **Wires before build** for new surfaces — see [`PRD v2.0.md`](PRD%20v2.0.md) |
| Age fit | Fun for kids; teacher tools separate |
| Free limits | Cap video / media size for free storage |
| Light UI | Force light `color-scheme` so Chromebook Auto Dark does not dull pastels |
| Layout | Chromebook / tablet first — wide glass card (not phone-narrow 520px) |

---

## 5. Must have (v1 baseline — still in force unless superseded)
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — full v1 shipped inventory from build arc -->

### 5.0 Intro video (before login)
<!-- created: 2026-11-24T12:00:00-08:00 -->

- Full-screen **`intro.mp4`** plays for guests before login / signup UI  
- Already signed-in users **skip** intro and land in the app  
- Default: try **unmuted**; if browser blocks autoplay-with-sound → fall back muted  
- Corner chips: **Mute / Unmute**, **Play** (if paused), **Skip / Continue**  
- Must never trap friends on a blank white/black screen — calm fail-open + **ErrorBoundary**  
- No hard timed dump to login that feels buggy / intrusive  

### 5.1 Account & onboarding — screens A1–A4
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — theme on login; ToS still v2 -->

- Sign up / log in / log out  
- Username, display name, password  
- Icon picker on create-account (editable on Me) — **emoji packs**  
- Emoji bar on display-name signup  
- Theme picker on login chrome (see §5.9)  
- Teacher access link → separate teacher login (not a kid tab)  
**Username rules (signup)**
<!-- created: 2026-11-23T19:55:00-08:00 -->

| Rule | Value |
|------|--------|
| Max username length | **20** |
| Max display name | **24** |
| Allowed chars | `a–z`, `0–9`, `_` only |
| Vulgar / threat words | Blocked — ask for a kinder name |
| Duplicate | Exact match blocked |

**Auth shape (kids never see email)**
<!-- created: 2026-11-24T12:00:00-08:00 -->

- Supabase auth uses synthetic `{username}@rafflesia.local` under the hood  

### 5.2 Home feed (v1 — still live until FYP)
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — Home ships; FYP → PRD v2.0.md -->

- Following + own posts  
- Soft-deleted posts (`deleted_at`) never appear  
- Author name + verify badge; open profile  
- FYP replacement → [`PRD v2.0.md`](PRD%20v2.0.md) §1  

### 5.3 Post — screens C3–C6 (+ text)
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — upload + link sources -->

- Types: **Text / Link / Picture / Video**  
- Picture & video: **upload** (storage bucket `posts`) **or** paste media URL  
- Kid-readable size limits (pictures ~small; videos capped for free tier)  
- Captions / body / link titles run through text checker  
- Posted items appear on **Home**  

### 5.4 Messages — DMs only
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — DMs only under Messages -->

- Private 1:1 DMs from People / profile  
- Send text; **message likes**; real sender names + verify badges  
- Text blocked state (calm D5)  
- Teacher restrict can block messaging  
- **Group chats live under Lounge** (not under Messages)  

### 5.4.1 Lounge / group chats
<!-- created: 2026-11-23T19:58:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — Everyone = lounge room; Play removed -->

**Workflow:** [`GROUP_CHAT_WF.md`](GROUP_CHAT_WF.md)  
**SQL:** [`sql-lounge-everyone.sql`](sql-lounge-everyone.sql)

**Model:** Groups are **invite / add** — not a public “browse all groups” directory (safer for middle school), except system rooms below.

| Room | Who is in it | Who can post | Notes |
|------|----------------|--------------|-------|
| **Everyone** | Auto: every signup (`lounge_key = everyone`) | All members | Club lounge room — **not** a “friend group”; no add-friends UI |
| **Announcements & Updates** | — | — | **v2** — [`PRD v2.0.md`](PRD%20v2.0.md) §3 |
| Kid-created groups | Creator + invited friends | Members | Create + add friends from Lounge |

**Nav:** Primary tab **Lounge** replaced **Play** (games may return later as a sub-feature).

**Acceptance (v1 Everyone)**
<!-- created: 2026-11-24T12:00:00-08:00 -->

- [x] Room exists; signup / login joins via RPC / trigger  
- [x] Listed under Lounge, not as a normal “group chat” peer  
- [x] Members can chat; soft UX distinguishes lounge vs invite groups  

### 5.5 People / Matches / Me — screens E1–E5
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — website links, logout, face → Me -->

- Browse people, follow / unfollow, open profiles  
- Follow toggles follow only; **Message** starts a DM  
- Matches: same icon-pack cues  
- **Me:** edit display name, bio, avatar, banner, icon pack  
- **Website links** on profile (title + URL, up to **5**; http/https only) — SQL [`sql-profile-website-links.sql`](sql-profile-website-links.sql)  
- **Log out only on Me**  
- Theme picker on Me (compact)  
- Header corner **FaceAvatar** opens Me  

### 5.6 Play / games (off primary nav)
<!-- created: 2026-11-23T19:28:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — not in primary nav -->

- Play hub **removed from primary nav** when Lounge shipped  
- Games still in codebase (Icon match, Snake, 2048, Blocks, Tap Party) + optional scores SQL  
- May return later as a sub-feature / link from Me or Lounge  

### 5.7 Safety — text checker + teacher
<!-- created: 2026-11-23T19:31:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — soft-delete + verify + right rail -->

**Text checker**
<!-- created: 2026-11-24T12:00:00-08:00 -->

- Blocks bad words / threat phrases on messages, posts, bios, usernames, website titles  
- Builtin list + teacher DB phrases  
- Calm blocked UI (not scary)  

**Teacher console** (password-gated RPCs; separate from kid shell)
<!-- created: 2026-11-24T12:00:00-08:00 -->

| Tab | Capability |
|-----|------------|
| Flags | Flagged text attempts |
| Restrict | Block / unblock posting and messaging for a kid |
| Posts | List user posts; **soft-delete** one / all; **restore** |
| Verify | Assign / clear **pink · gold · blue** check badges |
| Words | Add / remove blocked phrases |
| Overview | Recent activity snapshot |

**Verify tiers (teacher-only)**
<!-- created: 2026-11-24T12:00:00-08:00 -->
<!-- SQL: sql-teacher-verify.sql -->

| Tier | Meaning |
|------|---------|
| Pink | Rafflesia Online creators |
| Gold | Honour / brand |
| Blue | Regular verified |
| (none) | No badge |

- Kids **cannot** self-verify — DB trigger + teacher RPC only  
- Badge shows next to names on Home, profiles, chats  

**Soft-delete posts**
<!-- created: 2026-11-24T12:00:00-08:00 -->
<!-- SQL: sql-teacher-moderation-posts.sql -->

- Hides post from Home without requiring account wipe  
- Needed because **restrict alone leaves old offensive posts visible**  
- Teacher can restore  

**Teacher chrome**
<!-- created: 2026-11-24T12:00:00-08:00 -->

- Full-height **right-side nav rail** (same pattern as kid shell)  

### 5.8 Look & navigation (v1 shipped)
<!-- created: 2026-11-23T19:35:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 — rail, wide card, light force -->

**Kid primary nav (v1 live):**  
**Home · Post · Messages · Lounge · People · Me**

**Shell**
<!-- created: 2026-11-24T12:00:00-08:00 -->

- Wide glass card for Chromebook (max ~1800px; stretch viewport — not 520px phone column)  
- **Right-side full-height nav rail** when logged in  
- Pastel / themeable surfaces; force light color-scheme  
- Icons: **emoji-only** in-app (AI jpg icon tiles removed from runtime; PNG packs remain backlog)  

Full tables + flows: [`SCREEN_MAP.md`](SCREEN_MAP.md).  
v2 nav + features: [`PRD v2.0.md`](PRD%20v2.0.md).

### 5.9 Themes (v1 late — shipped)
<!-- created: 2026-11-24T12:00:00-08:00 -->
<!-- code: src/lib/themes.ts · themeEngine.ts · ThemePicker -->

**Goal:** Modern pastel login / in-app colors without Chromebook readability traps.

**Shipped set (12 pastels):**
<!-- created: 2026-11-24T12:00:00-08:00 -->

| # | Id | Name |
|---|-----|------|
| 1 | `sky-mint` | Sky Mint |
| 2 | `peach-cream` | Peach Cream |
| 3 | `lemon-sage` | Lemon Sage |
| 4 | `rose-mist` | Rose Mist |
| 5 | `seafoam` | Seafoam |
| 6 | `apricot-sky` | Apricot Sky |
| 7 | `lilac-haze` | Lilac Haze |
| 8 | `coral-foam` | Coral Foam |
| 9 | `powder-blue` | Powder Blue |
| 10 | `honeydew` | Honeydew |
| 11 | `blush-teal` | Blush Teal |
| 12 | `lavender-sand` | Lavender Sand |

**Behavior**
<!-- created: 2026-11-24T12:00:00-08:00 -->

| Mode | Rule |
|------|------|
| Auto | Every calendar **hour**, pick at random from unused themes in the cycle |
| No repeats | Do not reuse until every theme in the pool has been used; then reset |
| Manual pick | Theme picker sets theme **immediately** and **locks** it |
| Lock | While locked, hourly auto **must not** rotate the user’s theme |
| Unlock | Kid taps **Use Auto rotate** → clear lock; resume hourly rotation |
| Persistence | `localStorage` on device (`rafflesia_theme_*` keys) |

**Where:** Login / signup chrome + Me (compact).  

Named colors + manga full-screen BGs → [`PRD v2.0.md`](PRD%20v2.0.md) §4.

### 5.10 Deploy / ops notes (v1)
<!-- created: 2026-11-24T12:00:00-08:00 -->

| Item | Value |
|------|--------|
| App repo (live build) | `OneDrive/Desktop/rafflesia-online` |
| Primary Pages | https://diyaanuppal.github.io/rafflesia-online/ |
| Mirror Pages | https://puppal1.github.io/rafflesia/ |
| Backend | Supabase Free project (profiles, RPCs, RLS, storage) |
| Teacher password | Gated RPCs (local fallback known to helpers — never in kid UI) |
| Wipe keepers | SQL wipe may remove all users except `@diyaan` / `@rafflesiaonline` |

---

## 6. Nice to have
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:00:00-08:00 -->

- More games after Icon match; return Play as optional sub-nav  
- Forward message; online cue; seasonal icon packs / real PNG stickers  
- Theme preview animations  
- Realtime message push (poll works today)  

---

## 7. Out of scope (v1)
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:10:00-08:00 -->

- Voice/video calls; store apps; ads/payments/paid domains  
- Hardcore multiplayer; AI-as-product; full Clever/SIS admin suite  
- New product surfaces listed in [`PRD v2.0.md`](PRD%20v2.0.md)  

---

## 8. Success — v1 done when…
<!-- created: 2026-11-23T19:21:00-08:00 -->
<!-- updated: 2026-11-24T12:10:00-08:00 — header logout -->

1. [x] Signup + icon + matches  
2. [x] Post (text/link/pic/video) + profile ≥ Gotcha (incl. website links)  
3. [x] DM + Lounge (Everyone + groups) with names + likes  
4. [x] Text blocked + teacher restrict + soft-delete + verify badges  
5. [x] Intro video that doesn’t trap friends on a blank screen  
6. [x] Themes: hourly auto + picker + **user lock**  
7. [x] Kid chrome: right rail, Face→Me, **Log out in header**, Lounge replaces Play, compact Me form  
8. [ ] School: Sites URL only; embed proven on Chromebook (**human / school**)  

---

## 9. Status
<!-- created: 2026-11-23T19:46:00-08:00 -->
<!-- updated: 2026-11-24T12:10:00-08:00 — v2 moved to own file -->

| Area | Status |
|------|--------|
| PRD v1.0 | **This file** — shipped baseline |
| PRD v2.0 | [`PRD v2.0.md`](PRD%20v2.0.md) — new features only |
| Intro / Home / Post / DMs / Lounge / themes / verify / websites | **Shipped** |
| School Sites / Chromebook proof | **Open — human** |

Tech stack & embed: [`TECH.md`](TECH.md).  
SQL runbook: [`SQL_RUN_ME_NOW.md`](SQL_RUN_ME_NOW.md).

---

## 10. Document history
<!-- created: 2026-11-24T12:10:00-08:00 -->

| Version | Date | Notes |
|---------|------|--------|
| 1.0 | 2026-11-23 | First lock — Gotcha parity, DMs/groups, teacher, pastel UX |
| 1.0+ | 2026-11-23 → 11-24 | Build arc documented in §5 |
| 1.0 | 2026-11-24T12:10 | v2 requirements moved to [`PRD v2.0.md`](PRD%20v2.0.md) |
