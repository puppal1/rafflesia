// created: 2026-11-25T01:25:00-08:00 — PRD v4 J5 poll card in chat
// updated: 2026-11-25T01:45:00-08:00 — letter choices, clear voted state, results bar
import { useCallback, useEffect, useState } from 'react'
import {
  closeChatPoll,
  getChatPoll,
  voteChatPoll,
  type ChatPoll,
} from '../lib/polls'

const LETTERS = ['A', 'B', 'C', 'D'] as const

type Props = {
  // created: 2026-11-25T01:25:00-08:00
  pollId: string
  userId: string
  canClose?: boolean
}

/** created: 2026-11-25T01:25:00-08:00 */
/** updated: 2026-11-25T01:45:00-08:00 */
export function PollCard({ pollId, userId, canClose }: Props) {
  const [poll, setPoll] = useState<ChatPoll | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [justVoted, setJustVoted] = useState(false)

  const reload = useCallback(async () => {
    try {
      const p = await getChatPoll(pollId)
      setPoll(p)
      setErr('')
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not load poll.')
    }
  }, [pollId])

  useEffect(() => {
    reload().catch(() => undefined)
  }, [reload])

  async function vote(optionId: string) {
    if (!poll || poll.closed_at) return
    setBusy(true)
    try {
      await voteChatPoll(pollId, optionId)
      setJustVoted(true)
      await reload()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not vote.')
    } finally {
      setBusy(false)
    }
  }

  async function close() {
    if (!window.confirm('Close this vote? People can still see results.')) return
    setBusy(true)
    try {
      await closeChatPoll(pollId)
      await reload()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not close.')
    } finally {
      setBusy(false)
    }
  }

  if (!poll && !err) {
    return (
      <div className="poll-card poll-card-loading">
        <p className="muted">Loading vote…</p>
      </div>
    )
  }
  if (!poll) return <p className="error">{err}</p>

  const total = poll.options.reduce((s, o) => s + Number(o.votes || 0), 0)
  const closed = Boolean(poll.closed_at)
  const voted = Boolean(poll.my_option_id)
  const showResults = voted || closed
  const showClose = (canClose || poll.created_by === userId) && !closed
  const winnerId =
    showResults && total > 0
      ? poll.options.reduce((best, o) =>
          Number(o.votes || 0) > Number(best.votes || 0) ? o : best,
        ).id
      : null

  return (
    <div
      className={`poll-card poll-card-live${closed ? ' closed' : ''}${justVoted ? ' just-voted' : ''}`}
    >
      <div className="poll-card-top">
        <span className="poll-pill">{closed ? 'Vote closed' : 'Club vote'}</span>
        {voted && !closed ? <span className="poll-pill soft">You voted</span> : null}
      </div>

      <p className="poll-q">{poll.question}</p>

      <div className="poll-options" role="listbox" aria-label="Vote choices">
        {poll.options.map((o, i) => {
          const votes = Number(o.votes || 0)
          const pct = total ? Math.round((votes / total) * 100) : 0
          const mine = poll.my_option_id === o.id
          const lead = showResults && o.id === winnerId && total > 0
          return (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={mine}
              className={`poll-opt${mine ? ' mine' : ''}${lead ? ' lead' : ''}${showResults ? ' results' : ''}`}
              disabled={busy || closed}
              onClick={() => vote(o.id)}
            >
              {showResults ? (
                <span className="poll-opt-bar" style={{ width: `${pct}%` }} aria-hidden />
              ) : null}
              <span className="poll-letter">{LETTERS[i] || i + 1}</span>
              <span className="poll-opt-main">
                <span className="poll-opt-label">
                  {o.label}
                  {mine ? <span className="poll-check"> ✓</span> : null}
                </span>
                {showResults ? (
                  <span className="poll-opt-meta">
                    {pct}% · {votes}
                  </span>
                ) : (
                  <span className="poll-opt-meta soft">Tap to pick</span>
                )}
              </span>
            </button>
          )
        })}
      </div>

      <div className="poll-foot-row">
        <p className="muted poll-foot">
          {closed
            ? `${total} vote${total === 1 ? '' : 's'} · closed`
            : voted
              ? `${total} vote${total === 1 ? '' : 's'} · tap another choice to change`
              : total
                ? `${total} vote${total === 1 ? '' : 's'} so far — pick one`
                : 'Be the first to vote'}
        </p>
        {showClose ? (
          <button className="ghost btn-compact" type="button" disabled={busy} onClick={close}>
            Close vote
          </button>
        ) : null}
      </div>
      {err ? <p className="error">{err}</p> : null}
    </div>
  )
}
