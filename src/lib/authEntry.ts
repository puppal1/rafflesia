// created: 2026-11-24T22:50:00-08:00 — soft school-site entry classification (not spoof-proof)
// updated: 2026-11-24T23:40:00-08:00 — login always challenged when off-site (was fail-gated only)
/** OPUSD Google Site that links/embeds Rafflesia */
export const SCHOOL_SITE_PREFIX = 'https://sites.google.com/opusd.us/'

export type AuthEntrySource = 'school' | 'offsite'

export type AuthEntryInfo = {
  // created: 2026-11-24T22:50:00-08:00
  source: AuthEntrySource
  referrer: string
  inIframe: boolean
  reason: string
}

const FAIL_KEY = 'rafflesia_auth_fails'
/** created: 2026-11-24T23:40:00-08:00 — school path: challenge after first failed login */
const FAIL_CAPTCHA_AFTER = 1

/** created: 2026-11-24T22:50:00-08:00 */
export function classifyAuthEntry(): AuthEntryInfo {
  if (typeof window === 'undefined') {
    return { source: 'offsite', referrer: '', inIframe: false, reason: 'ssr' }
  }
  const referrer = String(document.referrer || '')
  let inIframe = false
  try {
    inIframe = window.top !== window.self
  } catch {
    inIframe = true
  }
  const schoolRef = referrer.toLowerCase().startsWith(SCHOOL_SITE_PREFIX.toLowerCase())
  if (schoolRef) {
    return {
      source: 'school',
      referrer,
      inIframe,
      reason: inIframe ? 'school-referrer+iframe' : 'school-referrer',
    }
  }
  return {
    source: 'offsite',
    referrer,
    inIframe,
    reason: referrer ? 'other-referrer' : 'empty-referrer',
  }
}

/** created: 2026-11-24T22:50:00-08:00 */
export function getAuthFailCount(): number {
  if (typeof sessionStorage === 'undefined') return 0
  const n = Number(sessionStorage.getItem(FAIL_KEY) || '0')
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

/** created: 2026-11-24T22:50:00-08:00 */
export function bumpAuthFail(): number {
  const next = getAuthFailCount() + 1
  try {
    sessionStorage.setItem(FAIL_KEY, String(next))
  } catch {
    // ignore
  }
  return next
}

/** created: 2026-11-24T22:50:00-08:00 */
export function clearAuthFails(): void {
  try {
    sessionStorage.removeItem(FAIL_KEY)
  } catch {
    // ignore
  }
}

/**
 * created: 2026-11-24T22:50:00-08:00
 * updated: 2026-11-24T23:40:00-08:00 — off-site login AND signup always; school after 1 fail
 */
export function needsAuthChallenge(entry: AuthEntryInfo, _mode: 'login' | 'signup'): boolean {
  // updated: 2026-11-24T23:40:00-08:00 — mode kept for callers; both modes challenged off-site
  if (getAuthFailCount() >= FAIL_CAPTCHA_AFTER) return true
  // Off-site: always challenge signup and login (AI / direct github.io hits)
  if (entry.source === 'offsite') return true
  return false
}

export const AUTH_FAIL_CAPTCHA_AFTER = FAIL_CAPTCHA_AFTER

/** created: 2026-11-24T23:40:00-08:00 */
export function turnstileSiteKey(): string {
  return (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || ''
}
