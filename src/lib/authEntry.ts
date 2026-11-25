// created: 2026-11-24T22:50:00-08:00 — soft school-site entry classification (not spoof-proof)
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
const FAIL_CAPTCHA_AFTER = 3

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
    // cross-origin frame access denied ⇒ we are framed
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
 * Challenge when off-site OR after several failed logins (lax CAPTCHA policy).
 */
export function needsAuthChallenge(entry: AuthEntryInfo, mode: 'login' | 'signup'): boolean {
  if (getAuthFailCount() >= FAIL_CAPTCHA_AFTER) return true
  if (mode === 'signup' && entry.source === 'offsite') return true
  if (mode === 'login' && entry.source === 'offsite' && getAuthFailCount() >= 1) return true
  return false
}

export const AUTH_FAIL_CAPTCHA_AFTER = FAIL_CAPTCHA_AFTER
