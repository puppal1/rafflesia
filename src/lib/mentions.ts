// created: 2026-11-25T00:20:00-08:00 — @username parse / insert / soft-reply helpers
import type { Profile } from '../types'

/** created: 2026-11-25T00:20:00-08:00 — Rafflesia usernames are lowercase alnum + underscore */
const MENTION_IN_TEXT = /@([a-z0-9_]{1,32})\b/gi

/** created: 2026-11-25T00:20:00-08:00 */
export function extractMentionUsernames(text: string): string[] {
  const out = new Set<string>()
  const re = new RegExp(MENTION_IN_TEXT.source, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    out.add(m[1].toLowerCase())
  }
  return [...out]
}

/**
 * created: 2026-11-25T00:20:00-08:00
 * Active @query at caret for autocomplete (null if not typing a mention).
 */
export function getActiveMention(
  text: string,
  cursor: number,
): { start: number; query: string } | null {
  const safe = Math.max(0, Math.min(cursor, text.length))
  const before = text.slice(0, safe)
  const m = before.match(/@([a-z0-9_]*)$/i)
  if (!m) return null
  const atIdx = before.length - m[0].length
  if (atIdx > 0 && /[a-z0-9_]/i.test(before[atIdx - 1] || '')) return null
  return { start: atIdx, query: m[1] }
}

/** created: 2026-11-25T00:20:00-08:00 */
export function insertMentionAt(
  text: string,
  cursor: number,
  mentionStart: number,
  username: string,
): { text: string; cursor: number } {
  const handle = username.trim().replace(/^@/, '').toLowerCase()
  const insert = `@${handle} `
  const next = text.slice(0, mentionStart) + insert + text.slice(cursor)
  return { text: next, cursor: mentionStart + insert.length }
}

/** created: 2026-11-25T00:20:00-08:00 */
export function filterMentionPeople(
  people: Profile[],
  query: string,
  limit = 6,
): Profile[] {
  const q = query.trim().toLowerCase()
  const seen = new Set<string>()
  const out: Profile[] = []
  for (const p of people) {
    const u = (p.username || '').trim().toLowerCase()
    if (!u || seen.has(u)) continue
    const d = (p.display_name || '').trim().toLowerCase()
    if (q && !u.includes(q) && !d.includes(q)) continue
    seen.add(u)
    out.push(p)
    if (out.length >= limit) break
  }
  return out
}

/** created: 2026-11-25T00:20:00-08:00 — soft Reply seed */
export function replyMentionSeed(username: string): string {
  const handle = username.trim().replace(/^@/, '').toLowerCase()
  return handle ? `@${handle} ` : ''
}

/** created: 2026-11-25T00:20:00-08:00 — split for rendering */
export type MentionPiece =
  | { kind: 'text'; value: string }
  | { kind: 'mention'; value: string; username: string }

export function splitMentionText(text: string): MentionPiece[] {
  const pieces: MentionPiece[] = []
  const re = new RegExp(MENTION_IN_TEXT.source, 'gi')
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      pieces.push({ kind: 'text', value: text.slice(last, m.index) })
    }
    pieces.push({ kind: 'mention', value: m[0], username: m[1].toLowerCase() })
    last = m.index + m[0].length
  }
  if (last < text.length) pieces.push({ kind: 'text', value: text.slice(last) })
  if (pieces.length === 0 && text) pieces.push({ kind: 'text', value: text })
  return pieces
}
