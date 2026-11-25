# Rafflesia Online — Product Requirements (PRD v2.0)
<!-- created: 2026-11-24T11:55:00-08:00 — split from PRD.md §10 -->
<!-- updated: 2026-11-24T12:10:00-08:00 — manga full-screen theme BGs; own file -->
<!-- updated: 2026-11-24T12:20:00-08:00 — manga heroes/icons; post comments; send/share -->
<!-- updated: 2026-11-24T12:25:00-08:00 — reorder: UX → function → cosmetic -->
<!-- updated: 2026-11-24T12:30:00-08:00 — delete own posts/comments; delete account -->
<!-- baseline: PRD.md (v1.0 shipped) · tasks: TASKS.md · screens: SCREEN_MAP.md -->
<!-- updated: 2026-11-25T01:20:00-08:00 — later work → PRD v3.0.md -->
<!-- audience: Diyaan (~10) + parent helper -->

**This file = v2 features only.** Shipped v1 stays in [`PRD.md`](PRD.md).  
**After v2:** [`PRD v3.0.md`](PRD%20v3.0.md) (notifications, mentions, security, Siobhan depth, theme sheet).  
**Process:** wires before build ([`PRD.md`](PRD.md) §0).  
**Build order (hard):** **A UX → B Function → C Cosmetic** — do not jump to manga/themes before UX + core post/social function.

---

## 0. Implementation order (build this sequence)
<!-- created: 2026-11-24T12:25:00-08:00 -->

| Phase | What | Why first / last |
|-------|------|------------------|
| **A — UX** | Compact actions, content-first layout, auth/Me panels | Stops elongated buttons; every later screen inherits the pattern |
| **B — Function** | ToS → comments → delete own content → send/share → Announcements → FYP + search → Siobhan → **delete account** | Real product behavior kids use daily |
| **C — Cosmetic** | Named theme colors → manga full-screen BGs → manga icons / profile platter | Looks last; Seedream / gens after function is solid |

### 0.1 Success checklist (same order)
<!-- created: 2026-11-24T12:25:00-08:00 -->
<!-- updated: 2026-11-24T12:30:00-08:00 — self-delete + account delete -->

**A — UX**
1. Action buttons are **compact** (no full-page-wide bars); content takes most real estate  

**B — Function**
2. Signup **ToS / Privacy** checkbox + consent ledger  
3. **Comments** on text / link / picture / video posts  
4. Users can **delete their own posts & comments**  
5. **Send / share** posts to DM + Lounge  
6. Lounge **Announcements & Updates** (only `@rafflesiaonline` posts)  
7. **FYP** replaces Home + **FYP search**  
8. **Siobhan Daily** page + OPUSD link; nav updated  
9. Users can **delete their account** (Me)  

**C — Cosmetic**
10. Named theme colors (Rainbow / White / Black / …); keep hourly + **user lock**  
11. Manga **full-screen** BGs (heroes / villains / neutrals; dark + soft; quiet)  
12. Manga **heroes** for icons + profile platter  

---

# Phase A — UX fixes (do first)
<!-- created: 2026-11-24T12:25:00-08:00 -->

## A1. Content-first layout (no elongated buttons)
<!-- created: 2026-11-24T12:25:00-08:00 -->

**Goal:** Modern Chromebook UX — **content** (feeds, forms fields, lists) owns the space; **actions** stay small pills / chips.

| Rule | Detail |
|------|--------|
| No full-bleed CTAs | Primary / ghost / danger buttons must **not** stretch across the whole card by default |
| Action rows | `action-row` / compact pills; width `auto`; wrap if needed |
| Forms | Auth + Me + Post capped (~420px centered); fields may be full width of that column only |
| Tabs | Auth Sign up / Log in are compact chips — not two stretched halves of a wide card |
| Post / comment / send | Share, Comment, Send, Save = compact controls under content |
| Header | Log out stays compact in header (every page) |
| New UI | Any v2 wire/build **must** follow this — no regressions to giant bars |

**Acceptance**
<!-- created: 2026-11-24T12:25:00-08:00 -->

- [ ] Login / Me / Post primary actions are compact (not page-wide)  
- [ ] Feeds and lists use most of the main column  
- [ ] New comment / send / share controls ship compact from day one  

**Partial:** Me form + header logout + auth panel started in v1 late — **finish and apply globally** before Phase B screens.

---

# Phase B — Functionality (after UX)
<!-- created: 2026-11-24T12:25:00-08:00 -->

## B1. Terms of Service / Privacy Policy (signup consent)
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B1 -->

**Goal:** Kids (and parents helping) must acknowledge club rules before Create account; club keeps an audit copy.

### B1.1 Copy (kid-readable — refine legally later)
<!-- created: 2026-11-24T11:55:00-08:00 -->

**TERMS OF SERVICE**  
**PRIVACY POLICY**

By creating an account in **RAFFLESIA ONLINE**, you agree to:

1. **Chats and reports** — If someone reports an incident, your chats may be reviewed and shared with teachers / school adults as needed (they may be “leaked” from private to moderators for safety).  
2. **Your media is your responsibility** — Videos and pictures you post are your responsibility. If someone does something impermissible with your media, Rafflesia Online may **not** be able to help recover or undo that.  

### B1.2 Behavior + ledger
<!-- created: 2026-11-24T11:55:00-08:00 -->

| Requirement | Detail |
|-------------|--------|
| UI | Signup shows ToS + Privacy (scrollable) + **required checkbox** (compact) |
| Gate | Create account disabled until checked |
| Storage | Consent ledger: `user_id`, `username`, `agreed_at`, tos/privacy versions, `ip_address`, `device_info`, optional `raw_ack` |

**Acceptance**
<!-- created: 2026-11-24T11:55:00-08:00 -->

- [ ] Cannot create account without checking the box  
- [ ] One ledger row per signup with person, date, IP, device  
- [ ] Queryable in Supabase (no kid UI required)  

---

## B2. Post comments (all media types)
<!-- created: 2026-11-24T12:20:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B2; works on Home then FYP -->

**Goal:** Comments under **every** post type — text, link, picture, video — on Home (then FYP) and profile post views.

| Requirement | Detail |
|-------------|--------|
| Scope | **text**, **link**, **picture**, **video** (same UX) |
| UI | Comment list + **compact** composer (Phase A) |
| Content | Short text; emoji OK; **text checker** |
| Attribution | Name + verify badge; tap → profile |
| Empty | Calm “No comments yet — say something kind” |
| Soft-delete | Hidden with soft-deleted parent post |
| Restrict | Post/message restrict → cannot comment |
| Moderation | Teacher soft-delete comment (or with parent post) |
| Limits | ~280–500 chars (lock in wires) |

**Acceptance**
<!-- created: 2026-11-24T12:20:00-08:00 -->

- [ ] Comment on text / link / picture / video  
- [ ] Persist + visible to others  
- [ ] Text checker blocks bad comments  
- [ ] Soft-deleted post hides comments  

---

## B2b. Delete own posts & comments
<!-- created: 2026-11-24T12:30:00-08:00 -->

**Goal:** Authors can remove **their own** posts and **their own** comments without a teacher. Compact **Delete** control (Phase A) — confirm before remove.

| Content | Who can delete | Behavior |
|---------|----------------|----------|
| **Own post** | Author only | Soft-delete (same spirit as teacher hide) or hard-delete — prefer **soft-delete** so teacher audit trail stays; disappears from Home / FYP / profile |
| **Own comment** | Commenter only | Remove that comment; post stays |
| Others’ content | Never | No delete on someone else’s post/comment (teacher tools only) |
| Confirm | Required | Calm confirm: “Delete this post?” / “Delete this comment?” |
| Cascade | Own post delete | That post’s comments become hidden with the post |
| UX | Compact | Small Delete / trash chip — not a full-width bar |

**Acceptance**
<!-- created: 2026-11-24T12:30:00-08:00 -->

- [ ] Author can delete own text / link / picture / video post  
- [ ] Commenter can delete own comment only  
- [ ] Cannot delete others’ posts or comments  
- [ ] Deleted post gone from feeds; confirm step required  

---

## B3. Send / share posts
<!-- created: 2026-11-24T12:20:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B3 -->

**Goal:** From any post, **Send** to a friend (DM) or **Share** into a Lounge group — school-safe Gotcha-style.

| Action | Behavior |
|--------|----------|
| **Send** | Pick person → DM with **post card / preview** |
| **Share** | Pick Lounge group (incl. Everyone if member) → **share card** in that chat |
| Types | text, link, picture, video |
| Preview | Author, caption snippet, media thumb / link title |
| Safety | Optional note text-checked; respect messaging restrict |
| Privacy | Only rooms the kid is in; Announcements write still club-only later |
| UX | Compact **Send** / **Share** chips (Phase A) |

**Acceptance**
<!-- created: 2026-11-24T12:20:00-08:00 -->

- [ ] Send → DM preview  
- [ ] Share → Lounge chat preview  
- [ ] All four post types  
- [ ] Restricted kids blocked  
- [ ] Cannot author into Announcements unless `@rafflesiaonline`  

---

## B4. Lounge — “Announcements & Updates”
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B4 -->

**Goal:** Official club bulletin — everyone **reads**; only **`@rafflesiaonline`** **writes**.

| Rule | Value |
|------|--------|
| Title | **Announcements & Updates** |
| Membership | All signups (Everyone spirit) |
| Who may post | **Only `@rafflesiaonline`** |
| Others | Read-only; composer hidden; send rejected server-side |
| Safety | Text-checked; teacher tools apply |

**Acceptance**
<!-- created: 2026-11-24T11:55:00-08:00 -->

- [ ] Room in Lounge for every member  
- [ ] Non-club users cannot send (UI + RPC/RLS)  
- [ ] `@rafflesiaonline` posts visible to all  

---

## B5. For You Page (FYP) — replaces Home
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B5; after comments/share -->

**Goal:** Near full-panel vertical feed (TikTok-style). Carry forward comments + send/share from B2–B3.

| Requirement | Detail |
|-------------|--------|
| Types | Video, photo, text, link |
| Interaction | Snap / full-card scroll; one primary item on Chromebook |
| Attribution | Author + verify badge + profile |
| Empty / blocked | Calm empty; soft-deleted never shown |
| Nav | Replace **Home** with **For You** / **FYP** |

**Acceptance**
<!-- created: 2026-11-24T11:55:00-08:00 -->

- [ ] FYP is default landing tab (no separate Home feed)  
- [ ] Mixed media scroll without a separate viewer first  
- [ ] Soft-deleted posts stay hidden  
- [ ] Comments + send/share work on FYP items  

---

## B6. FYP search (people + media)
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B6 -->

**Goal:** Search bar **at top of FYP** finds people or media.

| Query | Results |
|-------|---------|
| People | Username / display name → profile / follow / message |
| Media | Posts by caption / body / link text |

**Acceptance**
<!-- created: 2026-11-24T11:55:00-08:00 -->

- [ ] Search UI on FYP  
- [ ] Empty query returns to FYP scroll  
- [ ] Text checker unchanged for creates  

---

## B7. Siobhan Daily + nav
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase B7 -->

**Goal:** School news page + final v2 nav.

| Element | Requirement |
|---------|-------------|
| Nav | **Siobhan Daily** reachable from primary rail |
| In-app | Article list / open (links / embeds OK for v2 start) |
| Link-out | **“Click here to go to Siobhan Daily!”** → [OPUSD Siobhán Daily](https://sites.google.com/opusd.us/siobhan/siobh%C3%A1n-daily) (`noopener`) |

**v2 nav target:**  
**FYP · Post · Messages · Lounge · People · Me · Siobhan Daily**  
(Short labels OK.) Update [`SCREEN_MAP.md`](SCREEN_MAP.md) + wires.

**Acceptance**
<!-- created: 2026-11-24T11:55:00-08:00 -->

- [ ] Page reachable from main nav  
- [ ] Link label + URL as above  
- [ ] Works in Google Sites embed (new tab OK)  

---

## B8. Delete account
<!-- created: 2026-11-24T12:30:00-08:00 -->

**Goal:** On **Me**, a kid can permanently leave Rafflesia Online. This is serious — confirm clearly; free-tier cleanup of their data.

| Requirement | Detail |
|-------------|--------|
| Where | **Me** profile only — compact **Delete account** (danger style), not in header next to Log out |
| Confirm | Two-step or typed confirm (e.g. type username) — calm kid-readable warning |
| Effect | Sign out; auth user removed/disabled; profile + own posts + own comments removed or soft-purged; follows cleaned; chat membership removed where possible |
| Keepers | Cannot wipe club/system accounts via this UI (`@rafflesiaonline` etc. protected) |
| Teacher | Teacher tools do not replace this — this is **self-serve** |
| Consent ledger | Keep ledger row for audit (do not erase that they once agreed) unless legal says otherwise later |
| UX | Compact danger control at bottom of Me — not a full-width page bar |

**Acceptance**
<!-- created: 2026-11-24T12:30:00-08:00 -->

- [ ] Me shows Delete account with strong confirm  
- [ ] After delete, user cannot log in; profile gone from People  
- [ ] Own posts/comments no longer visible on feeds  
- [ ] Other users’ content untouched  

---

# Phase C — Cosmetic (last)
<!-- created: 2026-11-24T12:25:00-08:00 -->

**Already shipped (v1 — [`PRD.md`](PRD.md) §5.9):** 12 pastels, hourly no-repeat, picker, **user lock**. Keep those rules for everything below.

## C1. Named theme colors
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase C1 -->

| # | Theme |
|---|--------|
| 1 | Glassy blue |
| 2 | Pink |
| 3 | Rainbow |
| 4 | Green |
| 5 | Purple |
| 6 | Red |
| 7 | Orange |
| 8 | Yellow |
| 9 | Magenta |
| 10 | White |
| 11 | Black |
| 12+ | Pastel / mixed combos |

**Behavior:** Auto hourly + no-repeat cycle; **user pick locks**; localStorage. Login + Me.

**Acceptance**
<!-- created: 2026-11-24T12:25:00-08:00 -->

- [x] ≥12 pastels + lock (v1)  
- [ ] Named set above present (White / Black / Rainbow Chromebook-safe)  
- [ ] Lock still honored  

---

## C2. Manga full-screen backgrounds
<!-- created: 2026-11-24T12:10:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase C2 -->

**Goal:** Kid manga **viewport backgrounds** behind glass UI.

| Requirement | Detail |
|-------------|--------|
| Coverage | Full viewport `cover`; glass readable |
| Cast | **Heroes**, **villains**, **neutrals** |
| Palette | Some **dark**, some **soft / decent** |
| Composition | **Not busy** — one clear subject, open space for UI |
| Style | School-safe manga; original IP only |
| Gen | Cursor / Nano Banana drafts; **Seedream rundrop** OK if needed (SFW) |
| Lock | Same as themes |

**Starter ids:** `hero-sky`, `hero-sunset`, `villain-night`, `villain-shadow`, `neutral-street`, `neutral-garden`  
Drafts: [`ux/theme-bgs/`](ux/theme-bgs/) → later `public/theme-bgs/`.

**Acceptance**
<!-- created: 2026-11-24T12:25:00-08:00 -->

- [ ] ≥6 BGs: hero + villain + neutral; dark + soft; quiet  
- [ ] Whole-page cover; UI readable  
- [ ] User BG pick locks  

---

## C3. Manga heroes — icons + profile platter
<!-- created: 2026-11-24T12:20:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — phase C3 -->

**Goal:** Same cast for **icons** and **profile face platter**.

| Surface | Requirement |
|---------|-------------|
| Icons | Hero / villain / neutral stickers (~64×64); beside or instead of emoji packs |
| Profile platter | Circular / sticker picks when no photo |
| Matches | Same pack → Icon Matches |
| Style | Simple bust/head — not busy scenes |
| Gen | Same as C2 (Seedream OK) |

**Acceptance**
<!-- created: 2026-11-24T12:20:00-08:00 -->

- [ ] ≥1 hero, ≥1 villain, ≥1 neutral as icon/face  
- [ ] Platter on Me / icon picker  
- [ ] Loads on Chromebook  

---

## Status (by phase)
<!-- created: 2026-11-24T12:10:00-08:00 -->
<!-- updated: 2026-11-24T12:30:00-08:00 — self-delete + account delete -->

| Phase | Epic | Status |
|-------|------|--------|
| A1 | Content-first / compact actions | Partial (Me/auth started) — **finish first** |
| B1 | ToS consent ledger | Not started |
| B2 | Post comments | Not started |
| B2b | Delete own posts & comments | Not started |
| B3 | Send / share posts | Not started |
| B4 | Announcements ACL | Not started |
| B5 | FYP | Not started |
| B6 | FYP search | Not started |
| B7 | Siobhan Daily + nav | Not started |
| B8 | Delete account | Not started |
| C1 | Named theme colors | Not started |
| C2 | Manga full-screen BGs | Draft assets only |
| C3 | Manga icons / profile platter | Not started |

---

## Document history
<!-- created: 2026-11-24T12:10:00-08:00 -->
<!-- updated: 2026-11-24T12:30:00-08:00 -->

| Version | Date | Notes |
|---------|------|--------|
| 2.0 | 2026-11-24 | Split from [`PRD.md`](PRD.md); FYP, search, Announcements, themes, Siobhan, ToS |
| 2.0 | 2026-11-24T12:10 | + manga full-screen BGs |
| 2.0 | 2026-11-24T12:20 | + manga platter; post comments; send/share |
| 2.0 | 2026-11-24T12:25 | **Reordered:** Phase A UX → B Function → C Cosmetic |
| 2.0 | 2026-11-24T12:30 | + **delete own posts/comments**; **delete account** |
