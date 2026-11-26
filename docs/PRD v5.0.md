# Rafflesia Online — Product Requirements (PRD v5.0)
<!-- created: 2026-11-25T20:40:00-08:00 — voice + video calls (1:1 and group) -->
<!-- updated: 2026-11-25T20:45:00-08:00 — locked: voice-only, invite groups only (OPUSD AUA) -->
<!-- baseline: PRD.md · v2 · v3 · v4 · tasks: TASKS.md -->
<!-- audience: Diyaan (~10) + parent helper -->

**This file = voice calling (group only).**  
Media: **Jitsi Meet** (audio) inside Rafflesia chrome. Invites: Supabase.  
**Policy context:** OPUSD AUA = educational use; no class-time non-instructional AV messaging; Google Meet is the district instructional tool. Peer **video** and **1:1** calls are **out** for v5.

---

## 0. Locked scope (v5)
<!-- created: 2026-11-25T20:40:00-08:00 -->
<!-- updated: 2026-11-25T20:45:00-08:00 -->

| # | Feature | Status |
|---|---------|--------|
| K1 | **Voice** calls only | **In** |
| K2 | **Invite group chats** only (Lounge groups kids created) | **In** |
| K3 | Ring / join / leave in-app | **In** |
| K4 | Mic mute via call UI | **In** |
| K5 | Camera **off** and not offered | **In** |

**Out of v5**
- Private **DM** / 1:1 calls  
- **Video** / camera on  
- **Everyone** lounge room calls (too big / hard to supervise)  
- **Announcements** calls  
- Recording, paid SFU, teacher listen-in  

---

## 1. Product rules
<!-- updated: 2026-11-25T20:45:00-08:00 -->

| Rule | Detail |
|------|--------|
| Where | Lounge **invite groups** only |
| Mode | **Voice** — Jitsi starts with video muted; no “start video call” control |
| Who starts | Group member (not messaging-restricted) |
| Who joins | Members of that group |
| Accept | Join from banner or “Join call” on the system message |
| School | Help copy: don’t use during class; Chromebook AUA still applies; school Wi‑Fi may block meet.jit.si |
| Privacy | No Rafflesia-side recording; warn that others could still record |

---

## 2. UX
<!-- updated: 2026-11-25T20:45:00-08:00 -->

1. Open a **group** chat → **📞** → **Voice call** (only option)  
2. Starter enters voice room (camera off)  
3. Other members get banner → **Join** / **Dismiss**  
4. System line in chat: “started a voice call”  
5. Hang up / End for everyone  

---

## 3. Tech
<!-- created: 2026-11-25T20:40:00-08:00 -->

- `call_sessions` with `mode = 'voice'` only from app  
- RPCs: `start_chat_call`, `end_chat_call`, `get_active_chat_call`, `list_my_ringing_calls`  
- Room on `meet.jit.si`; `startWithVideoMuted: true`  
- SQL: [`sql/prd-v5-calls.sql`](../sql/prd-v5-calls.sql)  

---

## 4. Human checklist
<!-- updated: 2026-11-25T20:45:00-08:00 -->

1. Run `sql/prd-v5-calls.sql`  
2. Test on Chromebook **outside class**; confirm mic permission  
3. Optional: ask OPUSD if peer voice in a club group is OK on 1:1 devices  
