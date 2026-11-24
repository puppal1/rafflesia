// created: 2026-11-24T13:35:00-08:00 — compact emoji like bar
import { useMemo, useState } from 'react'
import { REACTION_EMOJIS, type ReactionRow, type ReactionTarget, myReactionEmoji } from '../lib/reactions'

type Props = {
  // created: 2026-11-24T13:35:00-08:00
  targetType: ReactionTarget
  targetId: string
  userId: string
  rows: ReactionRow[]
  busy?: boolean
  onReact: (targetType: ReactionTarget, targetId: string, emoji: string) => void
}

/** created: 2026-11-24T13:35:00-08:00 */
export function ReactionBar({ targetType, targetId, userId, rows, busy, onReact }: Props) {
  const [open, setOpen] = useState(false)
  const mine = myReactionEmoji(rows, targetType, targetId, userId)

  const tallies = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) {
      if (r.target_type !== targetType || r.target_id !== targetId) continue
      map.set(r.emoji, (map.get(r.emoji) || 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [rows, targetType, targetId])

  return (
    <div className="reaction-bar">
      <div className="reaction-pills">
        {tallies.map(([emoji, count]) => (
          <button
            key={emoji}
            type="button"
            className={mine === emoji ? 'reaction-pill on' : 'reaction-pill'}
            disabled={busy}
            onClick={() => onReact(targetType, targetId, emoji)}
          >
            {emoji} {count}
          </button>
        ))}
        <button
          type="button"
          className="ghost btn-compact reaction-add"
          disabled={busy}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : mine || '😊'}
        </button>
      </div>
      {open ? (
        <div className="reaction-picker" role="listbox" aria-label="React">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              className={mine === emoji ? 'emoji-btn on' : 'emoji-btn'}
              disabled={busy}
              onClick={() => {
                onReact(targetType, targetId, emoji)
                setOpen(false)
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
