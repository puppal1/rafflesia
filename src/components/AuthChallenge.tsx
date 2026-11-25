// created: 2026-11-24T22:50:00-08:00 — lax auth challenge (math + optional Turnstile site key)
import { useEffect, useMemo, useState } from 'react'

type Props = {
  // created: 2026-11-24T22:50:00-08:00
  required: boolean
  onPassed: (ok: boolean) => void
  hint?: string
}

/** created: 2026-11-24T22:50:00-08:00 — simple kids-friendly check when Turnstile not configured */
function nextMath(): { q: string; a: number } {
  const a = 2 + Math.floor(Math.random() * 7)
  const b = 1 + Math.floor(Math.random() * 5)
  return { q: `${a} + ${b}`, a: a + b }
}

/**
 * created: 2026-11-24T22:50:00-08:00
 * If VITE_TURNSTILE_SITE_KEY is set, show Cloudflare widget placeholder note;
 * otherwise use a small math check (soft friction for off-site / failed logins).
 */
export function AuthChallenge({ required, onPassed, hint }: Props) {
  const siteKey = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined)?.trim() || ''
  const puzzle = useMemo(() => nextMath(), [required])
  const [answer, setAnswer] = useState('')
  const [localOk, setLocalOk] = useState(false)

  useEffect(() => {
    if (!required) {
      onPassed(true)
      setLocalOk(true)
      return
    }
    setLocalOk(false)
    setAnswer('')
    onPassed(false)
  }, [required, onPassed, puzzle.q])

  if (!required) return null

  function checkMath() {
    const ok = Number(answer) === puzzle.a
    setLocalOk(ok)
    onPassed(ok)
  }

  return (
    <div className="auth-challenge" role="group" aria-label="Quick check">
      <p className="muted" style={{ marginBottom: 6, fontSize: '0.85rem' }}>
        {hint ||
          (siteKey
            ? 'Quick check before continuing (Turnstile).'
            : 'Quick check — answer to continue (off-site or after failed tries).')}
      </p>
      {siteKey ? (
        <p className="muted" style={{ fontSize: '0.8rem' }}>
          Turnstile site key is set — wire widget + Edge verify in a follow-up deploy. Meanwhile use
          math check:
        </p>
      ) : null}
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
    </div>
  )
}
