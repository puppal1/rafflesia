// created: 2026-11-25T20:40:00-08:00 — PRD v5 incoming / active call banner
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listMyRingingCalls, type CallSession } from '../lib/calls'

type Props = {
  // created: 2026-11-25T20:40:00-08:00
  userId: string
  activeCallId?: string | null
  chatTitle: (chatId: string) => string
  onJoin: (call: CallSession) => void
  onOpenChat?: (chatId: string) => void
}

/** created: 2026-11-25T20:40:00-08:00 */
export function CallRingBanner({
  userId,
  activeCallId,
  chatTitle,
  onJoin,
  onOpenChat,
}: Props) {
  const [calls, setCalls] = useState<CallSession[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const refresh = useCallback(async () => {
    try {
      const rows = await listMyRingingCalls()
      setCalls(rows)
    } catch {
      setCalls([])
    }
  }, [])

  useEffect(() => {
    refresh().catch(() => undefined)
    const id = window.setInterval(() => {
      refresh().catch(() => undefined)
    }, 5000)
    return () => window.clearInterval(id)
  }, [refresh, userId])

  useEffect(() => {
    const channel = supabase
      .channel(`calls-ring-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'call_sessions' },
        () => {
          refresh().catch(() => undefined)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, refresh])

  const visible = calls.filter((c) => c.id !== activeCallId && !dismissed.has(c.id))
  if (visible.length === 0) return null
  const top = visible[0]

  return (
    <div className="call-ring-banner" role="status">
      <div className="call-ring-main">
        <span className="call-ring-glyph" aria-hidden>
          {top.mode === 'voice' ? '📞' : '📹'}
        </span>
        <div>
          <p className="call-ring-title">Voice call in {chatTitle(top.chat_id)}</p>
          <p className="call-ring-sub">Group voice — tap Join (no camera)</p>
        </div>
      </div>
      <div className="call-ring-actions">
        <button
          className="primary btn-compact"
          type="button"
          onClick={() => {
            onOpenChat?.(top.chat_id)
            onJoin(top)
          }}
        >
          Join
        </button>
        <button
          className="ghost btn-compact"
          type="button"
          onClick={() => setDismissed((prev) => new Set(prev).add(top.id))}
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
