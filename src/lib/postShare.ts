// created: 2026-11-24T12:35:00-08:00 — encode/decode shared post cards in chat

const PREFIX = '[[rafflesia_post:'
const SUFFIX = ']]'

/** created: 2026-11-24T12:35:00-08:00 */
export function encodePostShare(postId: string, note?: string): string {
  const tag = `${PREFIX}${postId}${SUFFIX}`
  const n = (note || '').trim()
  return n ? `${tag}\n${n}` : tag
}

/** created: 2026-11-24T12:35:00-08:00 */
export function parsePostShare(body: string | null | undefined): { postId: string; note: string } | null {
  if (!body) return null
  const m = body.match(/^\[\[rafflesia_post:([0-9a-f-]{36})\]\](?:\n([\s\S]*))?$/i)
  if (!m) return null
  return { postId: m[1], note: (m[2] || '').trim() }
}
