// created: 2026-11-24T22:50:00-08:00 — lax auth challenge (math + optional Turnstile site key)
// updated: 2026-11-24T23:40:00-08:00 — real Turnstile widget when site key set; math is soft fallback only
import { useEffect, useMemo, useRef, useState } from 'react'
import { turnstileSiteKey } from '../lib/authEntry'
import { supabase } from '../lib/supabase'

type Props = {
  // created: 2026-11-24T22:50:00-08:00
  // updated: 2026-11-24T23:40:00-08:00 — token for Edge verify
  required: boolean
  onPassed: (ok: boolean, token?: string) => void
  hint?: string
}

declare global {
  interface Window {
    // created: 2026-11-24T23:40:00-08:00
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
        },
      ) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

/** created: 2026-11-24T22:50:00-08:00 — soft fallback only (AI can solve; use Turnstile for real bots) */
function nextMath(): { q: string; a: number } {
  const a = 2 + Math.floor(Math.random() * 7)
  const b = 1 + Math.floor(Math.random() * 5)
  return { q: `${a} + ${b}`, a: a + b }
}

/** created: 2026-11-24T23:40:00-08:00 */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  const existing = document.querySelector('script[data-rafflesia-turnstile]')
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener('load', () => resolve(), { once: true })
    })
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.dataset.rafflesiaTurnstile = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Turnstile script failed'))
    document.head.appendChild(s)
  })
}

/**
 * created: 2026-11-24T23:40:00-08:00
 * Verify token with Supabase Edge Function (secret stays off the client).
 */
export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const base = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
  if (!base) return false
  try {
    const { data: sess } = await supabase.auth.getSession()
    const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || ''
    const res = await fetch(`${base}/functions/v1/verify-turnstile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${sess.session?.access_token || anon}`,
      },
      body: JSON.stringify({ token }),
    })
    if (!res.ok) return false
    const json = (await res.json()) as { ok?: boolean }
    return Boolean(json.ok)
  } catch {
    return false
  }
}

/**
 * created: 2026-11-24T22:50:00-08:00
 * updated: 2026-11-24T23:40:00-08:00 — Turnstile when configured; else soft math
 */
export function AuthChallenge({ required, onPassed, hint }: Props) {
  const siteKey = turnstileSiteKey()
  const puzzle = useMemo(() => nextMath(), [required])
  const [answer, setAnswer] = useState('')
  const [localOk, setLocalOk] = useState(false)
  const [turnstileErr, setTurnstileErr] = useState('')
  const boxRef = useRef<HTMLDivElement | null>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!required) {
      onPassed(true)
      setLocalOk(true)
      return
    }
    setLocalOk(false)
    setAnswer('')
    setTurnstileErr('')
    onPassed(false)

    if (!siteKey || !boxRef.current) return

    let cancelled = false
    loadTurnstileScript()
      .then(() => {
        if (cancelled || !boxRef.current || !window.turnstile) return
        if (widgetId.current) {
          try {
            window.turnstile.remove(widgetId.current)
          } catch {
            // ignore
          }
          widgetId.current = null
        }
        boxRef.current.innerHTML = ''
        widgetId.current = window.turnstile.render(boxRef.current, {
          sitekey: siteKey,
          callback: (token: string) => {
            setLocalOk(true)
            onPassed(true, token)
          },
          'expired-callback': () => {
            setLocalOk(false)
            onPassed(false)
          },
          'error-callback': () => {
            setTurnstileErr('Check failed to load — try refresh.')
            setLocalOk(false)
            onPassed(false)
          },
        })
      })
      .catch(() => {
        setTurnstileErr('Could not load bot check. Using backup question.')
      })

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current)
        } catch {
          // ignore
        }
        widgetId.current = null
      }
    }
  }, [required, onPassed, siteKey, puzzle.q])

  if (!required) return null

  function checkMath() {
    const ok = Number(answer) === puzzle.a
    setLocalOk(ok)
    onPassed(ok)
  }

  return (
    <div className="auth-challenge" role="group" aria-label="Bot check">
      <p className="muted" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
        {hint ||
          (siteKey
            ? 'Bot check before login / signup.'
            : 'Quick check (backup). Add Cloudflare Turnstile for stronger AI protection.')}
      </p>
      {siteKey ? (
        <>
          <div ref={boxRef} className="turnstile-box" />
          {turnstileErr ? <p className="error" style={{ fontSize: '0.8rem' }}>{turnstileErr}</p> : null}
        </>
      ) : null}
      {(!siteKey || turnstileErr) && (
        <div className="row-actions" style={{ alignItems: 'center', gap: 8 }}>
          <label>
            What is {puzzle.q}?{' '}
            <input
              type="number"
              inputMode="numeric"
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value)
                setLocalOk(false)
                onPassed(false)
              }}
              style={{ width: 64 }}
              aria-label="Challenge answer"
            />
          </label>
          <button className="ghost btn-compact" type="button" onClick={checkMath}>
            Check
          </button>
          {localOk ? <span className="muted">OK</span> : null}
        </div>
      )}
      {!siteKey ? (
        <p className="muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
          Math check is weak vs AI — set <code>VITE_TURNSTILE_SITE_KEY</code> + Edge secret for real CAPTCHA.
        </p>
      ) : null}
    </div>
  )
}
