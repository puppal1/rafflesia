// created: 2026-11-25T01:25:00-08:00 — PRD v4 J5 poll card in chat
import { useCallback, useEffect, useState } from 'react'
import {
  closeChatPoll,
  getChatPoll,
  voteChatPoll,
  type ChatPoll,
} from '../lib/polls'

type Props = {
  // created: 2026-11-25T01:25:00-08:00
  pollId: string
  userId: string
  canClose?: boolean
}

/** created: 2026-11-25T01:25:00-08:00 */
export function PollCard({ pollId, userId, canClose }: Props) {
  const [poll, setPoll] = useState<ChatPoll | null>(null)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

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
      await reload()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not vote.')
    } finally {
      setBusy(false)
    }
  }

  async function close() {
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

  if (!poll && !err) return <p className="muted">Loading poll…</p>
  if (!poll) return <p className="error">{err}</p>

  const total = poll.options.reduce((s, o) => s + Number(o.votes || 0), 0)
  const closed = Boolean(poll.closed_at)
  const showClose = canClose || poll.created_by === userId

  return (
    <div className={`poll-card${closed ? ' closed' : ''}`}>
      <p className="poll-q">{poll.question}</p>
      <div className="poll-options">
        {poll.options.map((o) => {
          const votes = Number(o.votes || 0)
          const pct = total ? Math.round((votes / total) * 100) : 0
          const mine = poll.my_option_id === o.id
          return (
            <button
              key={o.id}
              type="button"
              className={`poll-opt${mine ? ' mine' : ''}`}
              disabled={busy || closed}
              onClick={() => vote(o.id)}
            >
              <span className="poll-opt-label">{o.label}</span>
              <span className="poll-opt-meta">
                {votes} · {pct}%
              </span>
              <span className="poll-opt-bar" style={{ width: `${pct}%` }} />
            </button>
          )
        })}
      </div>
      <p className="muted poll-foot">
        {closed ? 'Closed' : 'Tap a choice to vote'} · {total} vote{total === 1 ? '' : 's'}
      </p>
      {showClose && !closed ? (
        <button className="ghost btn-compact" type="button" disabled={busy} onClick={close}>
          Close poll
        </button>
      ) : null}
      {err ? <p className="error">{err}</p> : null}
    </div>
  )
}
