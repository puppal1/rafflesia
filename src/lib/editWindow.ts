// created: 2026-11-25T01:25:00-08:00 — PRD v4 J4: 15-minute edit TTL
export const EDIT_TTL_MS = 15 * 60 * 1000

/** created: 2026-11-25T01:25:00-08:00 */
export function canEditCreatedAt(createdAt: string, now = Date.now()): boolean {
  const t = new Date(createdAt).getTime()
  if (Number.isNaN(t)) return false
  return now - t < EDIT_TTL_MS
}
