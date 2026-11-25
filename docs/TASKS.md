# Rafflesia Online — Task list
<!-- created: 2026-11-23T19:46:00-08:00 -->
<!-- updated: 2026-11-24T11:55:00-08:00 — PRD v2.0 epics added (FYP, themes, Siobhan, ToS) -->
<!-- updated: 2026-11-24T12:10:00-08:00 — v2 lives in PRD v2.0.md; manga BGs -->
<!-- updated: 2026-11-25T01:20:00-08:00 — Phase 7 PRD v3.0 inventory -->
<!-- live mirror: https://puppal1.github.io/rafflesia/ -->
<!-- QC: QC.md · groups: GROUP_CHAT_WF.md -->

---

## Snapshot (2026-11-23T21:15)
<!-- created: 2026-11-23T21:15:00-08:00 -->
<!-- updated: 2026-11-23T21:20:00-08:00 — Diyaan Pages queue stuck; use puppal1 mirror for QC -->

| Area | State |
|------|--------|
| Docs / map / wires | Done |
| Live auth + People + Chats + emoji | Live |
| Follow / counts / lists | App live; P1/P2 SQL already run |
| Group picker + add friends | Live (`e2cdbdc`+) |
| Icons / Matches / text block / teacher / Home-Post-Play | **Live on puppal1 mirror** — needs `sql-phase5-first-cut.sql` |
| DiyaanUppal GitHub Pages | **Stuck** — deploy fails “cancel db7b458”; admin must clear Pages env |
| School Chromebook / Sites | Path locked; not proven |
| Full Nano Banana PNG packs | Backlog (emoji placeholders live) |

---

## Pause gates
<!-- created: 2026-11-23T19:52:00-08:00 -->
<!-- updated: 2026-11-23T21:15:00-08:00 -->

| Gate | Artifact | Status |
|------|----------|--------|
| **G0** | `SCREEN_MAP.md` | **Done** |
| **G1** | `UX.md` §2 + live colors | **Done** |
| **G2** | `UX.md` §3 + `ux/icons/` | **Done** (emoji placeholders; PNG packs backlog) |
| **G3** | `wireframes/index.html` | **Done** |
| **G4** | Live auth | **Done** |
| **G5** | First-cut features | **Ready for QC** after phase5 SQL |

---

## Problem tasks
<!-- created: 2026-11-23T20:46:00-08:00 -->
<!-- updated: 2026-11-23T21:15:00-08:00 -->

| # | Problem | Status |
|---|---------|--------|
| **P1** | Follows RLS | **Done** (SQL run) |
| **P2** | Group member RPCs | **Done** (SQL run) |
| **P3** | Agent cannot apply SQL | Still human step |
| **P5** | Realtime messages | Optional |
| **P7** | Icon PNG packs incomplete | Emoji packs ship; PNG backlog |
| **P8** | School Sites / Chromebook | Open — human |
| **P9** | Phase5 SQL partial | Teacher OK; **run `sql-phase5-patch-missing-rpcs.sql`** for icons/posts/search/words |

---

## Phase 3 — Build / deploy
<!-- updated: 2026-11-23T21:15:00-08:00 -->

### 3.1 Social / chat / phase5
| # | Task | Status |
|---|------|--------|
| 3.1a–j | DMs, poll, groups, follow, lists, picker | **Done** live |
| 3.1k | Icon picker + Matches | **Done** in app (emoji packs) |
| 3.1l | Text checker + calm D5 | **Done** in app |
| 3.1m | Teacher console | **Done** in app (password stored in DB via `app_settings` / `verify_teacher_password`) |
| 3.2a–c | Home / Post / Play | **Done** first-cut in app |
| A6 | Nav: Home · Post · Messages · Play · People · Me | **Done** |
| **G5** | First-cut gate | **QC after phase5 SQL** |

### Still human / backlog
| # | Task | Notes |
|---|------|--------|
| 3.2d–e | Sites embed + Chromebook | School door |
| 2.0d–e | Nano Banana PNG packs | Replace emoji later |
| P5 | Realtime SQL | Optional |

---

## Next actions (ordered)
<!-- updated: 2026-11-24T11:55:00-08:00 — v2.0 after phase5 QC -->

1. **Dad:** Run [`sql-phase5-first-cut.sql`](sql-phase5-first-cut.sql) in Supabase (see [`SQL_RUN_ME_NOW.md`](SQL_RUN_ME_NOW.md))  
2. Hard refresh **https://puppal1.github.io/rafflesia/** (Phase 5 live)  
3. **Diyaan:** QC Suite L + Suite M in [`QC.md`](QC.md)  
4. **Admin (Diyaan account):** clear stuck Pages deploy on DiyaanUppal repo (Settings → Environments → `github-pages` → delete stuck deployment / re-enable Pages) so school URL catches up  
5. **v2.0:** Wire + build epics in Phase 6 ([`PRD v2.0.md`](PRD%20v2.0.md))  

---

## Phase 6 — PRD v2.0 (wires before build)
<!-- created: 2026-11-24T11:55:00-08:00 -->
<!-- updated: 2026-11-24T12:25:00-08:00 — build order A UX → B function → C cosmetic -->
<!-- updated: 2026-11-24T12:50:00-08:00 — A/B/C implemented in app; human runs SQL_RUN_ME_NOW -->

Source of truth: [`PRD v2.0.md`](PRD%20v2.0.md) — **build in this order only**

### Phase A — UX first
| # | Epic | PRD | Status |
|---|------|-----|--------|
| 6.A1 | Content-first layout; **no elongated full-page buttons** | A1 | **Done** (compact chips / auth-panel) |

### Phase B — Functionality
| # | Epic | PRD | Status |
|---|------|-----|--------|
| 6.B1 | Signup ToS/Privacy + consent ledger | B1 | **Done** — run `sql-consent-ledger.sql` |
| 6.B2 | **Post comments** (text / link / picture / video) | B2 | **Done** — run `sql-post-comments.sql` |
| 6.B2b | **Delete own** posts & comments | B2b | **Done** (same SQL) |
| 6.B3 | **Send / share** posts → DM + Lounge | B3 | **Done** |
| 6.B4 | Lounge **Announcements & Updates** (`@rafflesiaonline` only) | B4 | **Done** — run `sql-announcements.sql` |
| 6.B5 | **FYP** replaces Home | B5 | **Done** |
| 6.B6 | FYP **search** | B6 | **Done** |
| 6.B7 | **Siobhan Daily** + nav + `SCREEN_MAP` / wires | B7 | **Done** |
| 6.B8 | **Delete account** (Me, confirmed) | B8 | **Done** — run `sql-delete-account.sql` |

### Phase C — Cosmetic last
| # | Epic | PRD | Status |
|---|------|-----|--------|
| 6.C1 | Named theme colors | C1 | **Done** (lock preserved) |
| 6.C2 | Manga full-screen BGs (quiet heroes/villains/neutrals) | C2 | **Done** (`public/theme-bgs/`) |
| 6.C3 | Manga icons + profile platter | C3 | **Done** (`public/manga-icons/`) |

---

## Phase 7 — PRD v3.0 (post-v2 shipped inventory)
<!-- created: 2026-11-25T01:20:00-08:00 -->

Source: [`PRD v3.0.md`](PRD%20v3.0.md)

| # | Epic | Status |
|---|------|--------|
| 7.D1–D6 | Safety, hosting, captcha, teacher posts, passwords, startDm fix | **Done** (SQL human checks remain) |
| 7.E | Siobhan live feed / likes / dock / history | **Done** |
| 7.F | ChatPanel + @mentions + soft Reply | **Done** |
| 7.G | Dino notifications (no private DM) | **Done** |
| 7.H | Theme sheet + faith symbols + furry | **Done** |
| 7.I | Hidden users / FYP polish | **Done** |

**Human:** apply remaining SQL listed in PRD v3 §2; optional Turnstile keys.

---

## Phase 8 — PRD v4.0 (locked, not built)
<!-- created: 2026-11-25T01:18:00-08:00 -->

Source: [`PRD v4.0.md`](PRD%20v4.0.md)

| # | Epic | Status |
|---|------|--------|
| 8.J1 | Unread Messages — **DMs only** | Locked |
| 8.J2 | Teacher kid password reset | Locked |
| 8.J3 | Kid Report → teacher Flags | Locked |
| 8.J4 | Edit own post/comment — **15m TTL** | Locked |
| 8.J5 | Lounge polls | Locked |
| 8.J6 | Profile media grid | Locked |
| 8.J7 | Chat stickers / PNG | Locked |
| 8.J8 | Help / club rules | Locked |

**Parked:** Following+FYP tabs (decide later), mute, bookmarks, Play, presence, notif prefs, calendar, hashtags, nested replies, push, read receipts.

---

## Related
<!-- updated: 2026-11-25T01:18:00-08:00 -->
- [`PRD.md`](PRD.md) (v1.0) · [`PRD v2.0.md`](PRD%20v2.0.md) · [`PRD v3.0.md`](PRD%20v3.0.md) · [`PRD v4.0.md`](PRD%20v4.0.md) · [`SECURITY.md`](SECURITY.md)  
- [`SCREEN_MAP.md`](SCREEN_MAP.md) · [`UX.md`](UX.md) · [`TECH.md`](TECH.md) · [`QC.md`](QC.md)  
- App: `OneDrive/Desktop/rafflesia-online` → Pages `puppal1/rafflesia`  
