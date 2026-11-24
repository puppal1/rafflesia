// created: 2026-11-23T19:55:00-08:00
// updated: 2026-11-23T19:59:00-08:00 — drop ≥85% similarity; keep max/vulgar/exact duplicate
// Username rules: max length, vulgar filter, exact duplicate

/** created: 2026-11-23T19:55:00-08:00 */
export const USERNAME_MAX = 20
/** created: 2026-11-23T19:55:00-08:00 */
export const DISPLAY_NAME_MAX = 24

/** created: 2026-11-23T19:55:00-08:00 — school-safe blocklist (expand via teacher list later) */
const BAD_WORDS = [
  'fuck',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'cock',
  'pussy',
  'cunt',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'slut',
  'whore',
  'rape',
  'killme',
  'killyou',
  'suicide',
]

/** created: 2026-11-23T19:55:00-08:00 */
function normalize(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

/** created: 2026-11-23T19:55:00-08:00 */
export function containsBadWord(text: string): boolean {
  const n = normalize(text)
  return BAD_WORDS.some((w) => n.includes(w))
}

export type UsernameCheckOk = { ok: true; username: string }
export type UsernameCheckErr = { ok: false; message: string }
export type UsernameCheckResult = UsernameCheckOk | UsernameCheckErr

/**
 * created: 2026-11-23T19:55:00-08:00
 * updated: 2026-11-23T19:59:00-08:00
 * Shape + vulgar + length. Call before exact-duplicate DB check.
 */
export function validateUsernameShape(raw: string): UsernameCheckResult {
  const username = raw.trim().toLowerCase()
  if (!username) return { ok: false, message: 'Please enter a username.' }
  if (username.length > USERNAME_MAX) {
    return { ok: false, message: `Username must be ${USERNAME_MAX} characters or fewer.` }
  }
  if (username.length < 3) {
    return { ok: false, message: 'Username must be at least 3 characters.' }
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return { ok: false, message: 'Username: letters, numbers, and _ only (no spaces or @).' }
  }
  if (containsBadWord(username)) {
    return { ok: false, message: 'That username is not allowed. Please pick a kinder one.' }
  }
  return { ok: true, username }
}

/**
 * created: 2026-11-23T19:55:00-08:00
 * updated: 2026-11-23T19:59:00-08:00 — exact duplicate only (similarity dropped)
 */
export function findUsernameConflict(
  candidate: string,
  existingUsernames: string[],
): UsernameCheckErr | null {
  const c = candidate.trim().toLowerCase()
  for (const other of existingUsernames) {
    const o = other.trim().toLowerCase()
    if (o === c) {
      return { ok: false, message: 'That username is already taken. Please choose a new one.' }
    }
  }
  return null
}

/** created: 2026-11-23T19:55:00-08:00 */
export function validateDisplayName(raw: string): UsernameCheckErr | null {
  const d = raw.trim()
  if (d.length > DISPLAY_NAME_MAX) {
    return { ok: false, message: `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.` }
  }
  if (d && containsBadWord(d)) {
    return { ok: false, message: 'That display name is not allowed. Please pick a kinder one.' }
  }
  return null
}
