// created: 2026-11-25T01:45:00-08:00 — PRD v4 poll create sheet (convincing UX)
import { useMemo, useState } from 'react'

const LETTERS = ['A', 'B', 'C', 'D'] as const

type Props = {
  // created: 2026-11-25T01:45:00-08:00
  open: boolean
  busy?: boolean
  onClose: () => void
  onSubmit: (question: string, options: string[]) => Promise<void>
}

/** created: 2026-11-25T01:45:00-08:00 — full-screen sheet: write → preview → post */
export function PollComposer({ open, busy, onClose, onSubmit }: Props) {
  const [question, setQuestion] = useState('')
  const [opts, setOpts] = useState(['', ''])
  const [err, setErr] = useState('')
  const [localBusy, setLocalBusy] = useState(false)

  const cleaned = useMemo(
    () => opts.map((o) => o.trim()).filter(Boolean),
    [opts],
  )
  const q = question.trim()
  const ready = q.length >= 3 && cleaned.length >= 2
  const locked = busy || localBusy

  if (!open) return null

  function setOpt(i: number, value: string) {
    setOpts((prev) => {
      const next = [...prev]
      next[i] = value.slice(0, 80)
      return next
    })
  }

  function removeOpt(i: number) {
    setOpts((prev) => (prev.length <= 2 ? prev : prev.filter((_, j) => j !== i)))
  }

  async function post() {
    setErr('')
    if (!ready) {
      setErr('Need a question and at least 2 choices.')
      return
    }
    setLocalBusy(true)
    try {
      await onSubmit(q, cleaned)
      setQuestion('')
      setOpts(['', ''])
      onClose()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not post poll.')
    } finally {
      setLocalBusy(false)
    }
  }

  return (
    <div className="poll-sheet-overlay" role="dialog" aria-modal="true" aria-label="Create a club vote">
      <div className="poll-sheet">
        <header className="poll-sheet-head">
          <div>
            <p className="poll-sheet-kicker">Lounge</p>
            <h2 className="poll-sheet-title">Club vote</h2>
          </div>
          <button className="ghost btn-compact" type="button" disabled={locked} onClick={onClose}>
            Cancel
          </button>
        </header>

        <p className="poll-sheet-hint">Ask the room a quick question. Everyone in this chat can tap one answer.</p>

        <label className="poll-sheet-field">
          <span>Your question</span>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value.slice(0, 200))}
            placeholder="e.g. Pizza or tacos for Friday?"
            disabled={locked}
            autoFocus
          />
        </label>

        <div className="poll-sheet-choices">
          <p className="poll-sheet-choices-label">Choices (2–4)</p>
          {opts.map((o, i) => (
            <div className="poll-sheet-choice-row" key={`choice-${i}`}>
              <span className="poll-letter" aria-hidden>
                {LETTERS[i] || i + 1}
              </span>
              <input
                value={o}
                onChange={(e) => setOpt(i, e.target.value)}
                placeholder={`Choice ${LETTERS[i] || i + 1}`}
                disabled={locked}
              />
              {opts.length > 2 ? (
                <button
                  className="ghost btn-compact poll-sheet-remove"
                  type="button"
                  disabled={locked}
                  aria-label={`Remove choice ${LETTERS[i]}`}
                  onClick={() => removeOpt(i)}
                >
                  ×
                </button>
              ) : (
                <span className="poll-sheet-remove-spacer" />
              )}
            </div>
          ))}
          {opts.length < 4 ? (
            <button
              className="ghost btn-compact"
              type="button"
              disabled={locked}
              onClick={() => setOpts((v) => [...v, ''])}
            >
              + Add choice
            </button>
          ) : null}
        </div>

        <div className="poll-preview" aria-hidden={!ready}>
          <p className="poll-preview-label">Preview</p>
          <div className="poll-card poll-card-live">
            <div className="poll-card-top">
              <span className="poll-pill">Club vote</span>
            </div>
            <p className="poll-q">{q || 'Your question shows here'}</p>
            <div className="poll-options">
              {(cleaned.length ? cleaned : ['Choice A', 'Choice B']).map((label, i) => (
                <div key={`prev-${i}`} className="poll-opt poll-opt-preview">
                  <span className="poll-letter">{LETTERS[i]}</span>
                  <span className="poll-opt-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {err ? <p className="error">{err}</p> : null}

        <footer className="poll-sheet-foot">
          <button className="primary" type="button" disabled={locked || !ready} onClick={post}>
            {locked ? 'Posting…' : 'Post vote to chat'}
          </button>
        </footer>
      </div>
    </div>
  )
}
