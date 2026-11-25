// created: 2026-11-25T00:30:00-08:00 — Rafflesia bloom notification control + What’s new modal
// updated: 2026-11-25T00:40:00-08:00 — mark read on close; faster poll if realtime lags
// updated: 2026-11-25T01:05:00-08:00 — dino icon; jumps when unread
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { iconEmoji } from '../lib/iconPacks'
import {
  fetchMyNotifications,
  fetchUnreadNotificationCount,
  formatNotifWhen,
  markAllNotificationsRead,
  notificationGlyph,
  type AppNotification,
} from '../lib/notifications'
import { FaceAvatar } from './FaceAvatar'

export type NotifNavigateTarget = {
  // created: 2026-11-25T00:30:00-08:00
  type: string
  chatId?: string | null
  actorId?: string | null
  actorUsername?: string | null
  targetType?: string | null
  targetId?: string | null
}

type Props = {
  // created: 2026-11-25T00:30:00-08:00
  userId: string
  onNavigate: (target: NotifNavigateTarget) => void
}

/** created: 2026-11-25T00:30:00-08:00 */
export function BloomInbox({ userId, onNavigate }: Props) {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [rows, setRows] = useState<AppNotification[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [missingSql, setMissingSql] = useState(false)

  const refreshCount = useCallback(async () => {
    try {
      const n = await fetchUnreadNotificationCount(supabase)
      setUnread(n)
      setMissingSql(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (/count_my_unread|list_my_notifications|schema cache/i.test(msg)) {
        setMissingSql(true)
      }
    }
  }, [])

  const loadList = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const list = await fetchMyNotifications(supabase, 50)
      setRows(list)
      setMissingSql(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not load notifications.'
      if (/list_my_notifications|schema cache/i.test(msg)) {
        setMissingSql(true)
        setErr('Notifications need sql/notifications.sql — run in Supabase.')
      } else setErr(msg)
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    refreshCount().catch(() => undefined)
    const id = window.setInterval(() => {
      refreshCount().catch(() => undefined)
    }, 8_000)
    return () => window.clearInterval(id)
  }, [refreshCount, userId])

  useEffect(() => {
    const channel = supabase
      .channel(`notif-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          refreshCount().catch(() => undefined)
          if (open) loadList().catch(() => undefined)
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, open, refreshCount, loadList])

  async function openModal() {
    setOpen(true)
    await loadList()
    await refreshCount()
  }

  async function closeModal() {
    // updated: 2026-11-25T00:40:00-08:00 — mark read when leaving so rows are visible first
    setOpen(false)
    try {
      await markAllNotificationsRead(supabase)
      setUnread(0)
    } catch {
      // ignore if SQL missing
    }
  }

  function onRow(n: AppNotification) {
    onNavigate({
      type: n.type,
      chatId: n.chat_id,
      actorId: n.actor_id,
      actorUsername: n.actor_username,
      targetType: n.target_type,
      targetId: n.target_id,
    })
    closeModal().catch(() => undefined)
  }

  const active = unread > 0
  const badge = unread > 9 ? '9+' : String(unread)

  return (
    <>
      <button
        type="button"
        className={active ? 'bloom-btn active' : 'bloom-btn'}
        title={active ? `${unread} new` : 'What’s new'}
        aria-label={active ? `Notifications, ${unread} unread` : 'Notifications'}
        onClick={() => openModal()}
      >
        <span className={active ? 'bloom-glyph dino jumping' : 'bloom-glyph dino'} aria-hidden>
          🦕
        </span>
        {active ? <span className="bloom-badge">{badge}</span> : null}
      </button>

      {open ? (
        <div
          className="bloom-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="What’s new"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal().catch(() => undefined)
          }}
        >
          <div className="bloom-modal">
            <header className="bloom-modal-head">
              <div>
                <h2 className="bloom-modal-title">What’s new</h2>
                <p className="muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  Latest club activity
                </p>
              </div>
              <button className="ghost btn-compact" type="button" onClick={() => closeModal()}>
                Close
              </button>
            </header>
            {err ? <p className="error">{err}</p> : null}
            {missingSql && !err ? (
              <p className="muted">Run sql/notifications.sql in Supabase to enable this inbox.</p>
            ) : null}
            <div className="bloom-list soft-scroll">
              {busy && rows.length === 0 ? (
                <p className="muted">Loading…</p>
              ) : rows.length === 0 ? (
                <p className="bloom-empty">You’re all caught up.</p>
              ) : (
                rows.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className={
                      n.pinned && !n.read_at
                        ? 'bloom-row pinned unread'
                        : !n.read_at
                          ? 'bloom-row unread'
                          : 'bloom-row'
                    }
                    onClick={() => onRow(n)}
                  >
                    <span className="bloom-row-face">
                      {n.actor_id ? (
                        <FaceAvatar
                          avatarUrl={n.actor_avatar_url}
                          iconPack={n.actor_icon_pack}
                          iconId={n.actor_icon_id}
                          size="sm"
                        />
                      ) : (
                        <span className="bloom-teacher-face">T</span>
                      )}
                    </span>
                    <span className="bloom-row-main">
                      <span className="bloom-row-title">
                        <span className="bloom-row-glyph">{notificationGlyph(n.type)}</span>
                        {n.title}
                      </span>
                      {n.body ? <span className="bloom-row-body">{n.body}</span> : null}
                      <span className="bloom-row-meta">
                        {n.actor_username && n.actor_id
                          ? `${iconEmoji(n.actor_icon_pack, n.actor_icon_id)} @${n.actor_username} · `
                          : null}
                        {formatNotifWhen(n.created_at)}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
