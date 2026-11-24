// created: 2026-11-24T14:30:00-08:00 — site-wide hide list (People, FYP, search, pickers)
/** Usernames that must not appear on the public site (case-insensitive). */
export const HIDDEN_USERNAMES = new Set(['pr123'])

/** created: 2026-11-24T14:30:00-08:00 */
export function isHiddenUsername(username: string | null | undefined): boolean {
  const u = (username || '').trim().toLowerCase().replace(/^@/, '')
  return Boolean(u) && HIDDEN_USERNAMES.has(u)
}

/** created: 2026-11-24T14:30:00-08:00 */
export function isHiddenProfile(p: { username?: string | null } | null | undefined): boolean {
  return isHiddenUsername(p?.username)
}

/** created: 2026-11-24T14:30:00-08:00 */
export function visibleProfiles<T extends { username?: string | null }>(rows: T[]): T[] {
  return rows.filter((p) => !isHiddenProfile(p))
}
