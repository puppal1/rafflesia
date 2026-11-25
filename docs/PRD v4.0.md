# Rafflesia Online — Product Requirements (PRD v4.0)
<!-- created: 2026-11-25T01:18:00-08:00 — locked wishlist after PRD 1–3 review -->
<!-- baseline: PRD.md · PRD v2.0.md · PRD v3.0.md · tasks: TASKS.md -->
<!-- audience: Diyaan (~10) + parent helper -->

**This file = next features locked after reviewing v1–v3.**  
Not built yet — wires before build ([`PRD.md`](PRD.md) §0).  
Shipped truth: [`PRD.md`](PRD.md) · [`PRD v2.0.md`](PRD%20v2.0.md) · [`PRD v3.0.md`](PRD%20v3.0.md).

---

## 0. Locked for v4 (one screen)
<!-- created: 2026-11-25T01:18:00-08:00 -->

| # | Feature | One-line |
|---|---------|----------|
| J1 | Unread on **Messages** (DMs only) | Badge / unread only for **private 1:1** — never lounge/group |
| J2 | Teacher **kid password reset** | Teacher sets temp password; kids have no email reset |
| J3 | Kid **Report** → teacher Flags | Report post / comment / user with deep link |
| J4 | **Edit** own post/comment | Allowed for **15 minutes**; after that edit locked; **delete always OK** |
| J5 | Lounge **polls** | Club / group votes (`@rafflesiaonline` + group polls) |
| J6 | **Profile media grid** | All that user’s pics/videos in one place |
| J7 | Chat **stickers / PNG** | Send sticker from icon backlog packs |
| J8 | **Help / club rules** | Kid-readable page; links ToS (no re-signup) |

**Parked (not v4):** Following+FYP dual tabs (explained separately — decide later), mute/soft-block, saved posts, Play return, presence, notification prefs, calendar/events, hashtags, nested replies, browser push, read receipts.

---

## 1. Product sentence (v4 target)
<!-- created: 2026-11-25T01:18:00-08:00 -->

After v4, kids can see **unread DMs**, **edit** fresh posts for 15 minutes, **report** bad stuff to teachers, **vote** in lounge polls, browse a **media grid** on profiles, send **stickers**, and open **Help / club rules** — and teachers can **reset a locked-out kid’s password**.

---

# Phase J — Locked features

## J1. Unread on Messages — direct DMs only
<!-- created: 2026-11-25T01:18:00-08:00 -->

**Why:** Private DMs never enter the dino inbox (v3 lock). Without a Messages badge, new DMs are easy to miss.

| Rule | Detail |
|------|--------|
| Scope | **Private 1:1 DMs only** |
| Not counted | Lounge Everyone, invite groups, Announcements |
| UI | Unread badge / dot on **Messages** rail tab; optional unread mark per thread in inbox list |
| Clear | Opening the DM thread clears that thread’s unread |
| Restrict | Restricted kids still cannot message; badge rules unchanged for received history |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] New DM from a friend badges Messages  
- [ ] New message in a group / Everyone / Announcements does **not** badge Messages  
- [ ] Open thread → badge for that chat clears  

---

## J2. Teacher password reset for kids
<!-- created: 2026-11-25T01:18:00-08:00 -->

**Why:** Auth has no kid email. Forgotten password = locked out forever without an adult path.

| Requirement | Detail |
|-------------|--------|
| Who | Teacher console only (password-gated RPC) |
| Action | Pick student → set **temporary password** (≥6) |
| After | Kid logs in with temp password; encouraged to **Change password** on Me (v3 D5) |
| Keepers | Cannot reset protected system accounts via casual UI |
| Audit | Optional log: who reset whom + when (teacher-facing) |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Teacher can set a new password for a named kid  
- [ ] Kid can log in with that password  
- [ ] Kid UI still has no email reset flow  

---

## J3. Kid Report → teacher Flags
<!-- created: 2026-11-25T01:18:00-08:00 -->

**Why:** Text checker catches words; it does not catch “mean but clean” or harassment. Kids need a report path; teachers need a queue with context.

| Target | Kid can report |
|--------|----------------|
| Post | From FYP / profile |
| Comment | From comment list |
| User | From profile |
| Message | Optional later — **park** for v4 start unless wires say include DM report |

| Requirement | Detail |
|-------------|--------|
| UI | Compact **Report** + calm reason (short text, text-checked) + confirm |
| Storage | Report row: reporter, target type/id, reason, created_at, status |
| Teacher | **Flags** (or Reports) tab lists open reports; open → deep link to content / profile |
| Abuse | Rate-limit silly spam reports (calm; no scare) |
| Privacy | Reporter identity visible to **teacher only**, not to the reported kid |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Kid can report post, comment, user  
- [ ] Teacher sees report + can open the target  
- [ ] Reported kid does not see who reported them  

---

## J4. Edit own post / comment (15-minute TTL)
<!-- created: 2026-11-25T01:18:00-08:00 -->

| Rule | Detail |
|------|--------|
| Who | Author of post / comment only |
| Window | **15 minutes** from `created_at` |
| After TTL | **Edit control hidden / rejected** server-side |
| Delete | **Always allowed** for own content (existing soft-delete) |
| Checker | Edited body runs text checker + server assert |
| Mark | Optional quiet “edited” cue after first successful edit |
| Others | Never edit someone else’s content |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Edit works within 15 minutes  
- [ ] Edit fails / unavailable after 15 minutes  
- [ ] Delete still works after the window  
- [ ] Cannot edit others’ posts/comments  

---

## J5. Lounge polls
<!-- created: 2026-11-25T01:18:00-08:00 -->

**Goal:** Club / group **votes** that feel native in Lounge — not a separate product.

| Mode | Who creates | Who votes |
|------|-------------|-----------|
| Club poll | `@rafflesiaonline` (Announcements or Everyone — lock in wires) | All members |
| Group poll | Group members (or creator-only — lock in wires; default **any member**) | That group’s members |

| Requirement | Detail |
|-------------|--------|
| Options | 2–4 choices; short labels; text-checked |
| One vote | One vote per user per poll (change vote OK unless wires say lock) |
| UI | Compact poll card in chat stream; live counts |
| Close | Creator / club can close; closed = results only |
| Safety | Restrict blocks create/vote; teacher can soft-remove abusive poll |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Club account can post a poll visible to members  
- [ ] Group can run a poll among members  
- [ ] Counts update; one vote per kid  
- [ ] Text checker on question + options  

---

## J6. Profile media grid
<!-- created: 2026-11-25T01:18:00-08:00 -->

| Requirement | Detail |
|-------------|--------|
| Where | Profile (self + others) — tab or section under posts |
| Content | That user’s **picture** + **video** posts (not soft-deleted) |
| Layout | Grid thumbs; tap → open post / enlarge |
| Empty | Calm “No pictures or videos yet” |
| Hidden | Respect hide-list / soft-delete |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Profile shows grid of that user’s media posts  
- [ ] Soft-deleted media absent  
- [ ] Tap opens the post  

---

## J7. Chat stickers / PNG send
<!-- created: 2026-11-25T01:18:00-08:00 -->

| Requirement | Detail |
|-------------|--------|
| Source | Existing icon / manga / faith / furry PNG backlog packs |
| Where | DM + Lounge composers — sticker tray next to photo attach |
| Send | Sticker message type (or image with sticker flag) — no caption required |
| School | Packs stay school-safe; no external sticker store |
| Matches | Optional: same-pack sticker ≠ auto friend match (icon pack still drives Matches) |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Kid can pick a sticker and send in DM / Lounge  
- [ ] Recipient sees sticker inline  
- [ ] Works on Chromebook  

---

## J8. Help / club rules page
<!-- created: 2026-11-25T01:18:00-08:00 -->

| Requirement | Detail |
|-------------|--------|
| Where | Reachable from **Me** (and optionally login chrome link) |
| Content | Kid-readable: be kind, reports, media responsibility, teacher tools exist |
| ToS | Link / embed same ToS + Privacy copy as signup — **no** re-check required |
| Tone | Calm pastel; not legal-scary |
| Nav | Does not need a primary rail tab unless wires prefer it |

**Acceptance**
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [ ] Page opens from Me  
- [ ] Shows club rules + link to ToS/Privacy  
- [ ] Does not force re-consent  

---

## 2. Parked (explicitly not v4)
<!-- created: 2026-11-25T01:18:00-08:00 -->

| Idea | Note |
|------|------|
| Following + FYP dual tabs | Explained in chat; **await decision** — not locked |
| Mute / soft-block | Park |
| Saved / bookmarks | Park |
| Play hub return | Park |
| Online presence | Park |
| Notification type prefs | Park |
| Club calendar / RSVP | Park |
| Hashtag chips | Park |
| Nested reply threads | Park (v3) |
| Browser push | Park (v3) |
| Read receipts | Park |
| DM report in first cut | Park unless J3 wires expand |

---

## 3. Suggested build order
<!-- created: 2026-11-25T01:18:00-08:00 -->

1. **J1** Unread DMs (high daily pain)  
2. **J2** Teacher password reset (ops / lockout)  
3. **J3** Report → Flags (safety)  
4. **J4** Edit TTL 15m  
5. **J8** Help page (fast, docs-shaped)  
6. **J6** Profile media grid  
7. **J5** Lounge polls  
8. **J7** Stickers (needs asset tray polish)

Wires before each surface.

---

## 4. Related
<!-- created: 2026-11-25T01:18:00-08:00 -->

- [`PRD.md`](PRD.md) · [`PRD v2.0.md`](PRD%20v2.0.md) · [`PRD v3.0.md`](PRD%20v3.0.md) · [`TASKS.md`](TASKS.md)  
