// created: 2026-11-23T19:55:00-08:00
// Username rules: max length, vulgar filter, duplicate, ≥85% similarity block

/** created: 2026-11-23T19:55:00-08:00 */
export const USERNAME_MAX = 20
/** created: 2026-11-23T19:55:00-08:00 */
export const DISPLAY_NAME_MAX = 24
/** created: 2026-11-23T19:55:00-08:00 */
export const SIMILARITY_BLOCK = 0.85

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
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

/** created: 2026-11-23T19:55:00-08:00 — 1 = identical, 0 = totally different */
export function similarityRatio(a: string, b: string): number {
  const x = normalize(a)
  const y = normalize(b)
  if (!x || !y) return 0
  if (x === y) return 1
  const dist = levenshtein(x, y)
  const maxLen = Math.max(x.length, y.length)
  return 1 - dist / maxLen
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
 * Shape + vulgar + length. Call before duplicate/similarity DB checks.
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
 * Duplicate exact + ≥85% similar to any existing username → ask for a new one.
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
    const sim = similarityRatio(c, o)
    if (sim >= SIMILARITY_BLOCK) {
      return {
        ok: false,
        message: `That username is too similar to an existing one (${Math.round(sim * 100)}% match). Please choose a new one.`,
      }
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
