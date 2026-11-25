// created: 2026-11-25T00:30:00-08:00 — client helpers for in-app bloom inbox
import type { SupabaseClient } from '@supabase/supabase-js'

export type AppNotification = {
  // created: 2026-11-25T00:30:00-08:00
  id: string
  actor_id: string | null
  actor_username: string
  actor_display_name: string
  actor_avatar_url: string | null
  actor_icon_pack: string | null
  actor_icon_id: string | null
  type: string
  title: string
  body: string | null
  target_type: string | null
  target_id: string | null
  chat_id: string | null
  created_at: string
  read_at: string | null
  pinned: boolean
}

/** created: 2026-11-25T00:30:00-08:00 */
export function notificationGlyph(type: string): string {
  switch (type) {
    case 'teacher_restrict':
    case 'teacher_verify':
      return '◈'
    case 'chat_message':
    case 'chat_mention':
      return '💬'
    case 'announcement':
      return '📣'
    case 'post_reaction':
      return '♥'
    case 'post_comment':
    case 'post_comment_followup':
      return '✎'
    case 'follow':
      return '＋'
    case 'news_story_reaction':
      return '📰'
    default:
      return '✦'
  }
}

/** created: 2026-11-25T00:30:00-08:00 */
export function formatNotifWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 36) return `${hrs}h`
  const days = Math.round(hrs / 24)
  if (days < 8) return `${days}d`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** created: 2026-11-25T00:30:00-08:00 */
export async function fetchMyNotifications(
  supabase: SupabaseClient,
  limit = 50,
): Promise<AppNotification[]> {
  const { data, error } = await supabase.rpc('list_my_notifications', { p_limit: limit })
  if (error) throw error
  return (data || []) as AppNotification[]
}

/** created: 2026-11-25T00:30:00-08:00 */
export async function fetchUnreadNotificationCount(
  supabase: SupabaseClient,
): Promise<number> {
  const { data, error } = await supabase.rpc('count_my_unread_notifications')
  if (error) throw error
  return Number(data || 0)
}

/** created: 2026-11-25T00:30:00-08:00 */
export async function markAllNotificationsRead(
  supabase: SupabaseClient,
): Promise<void> {
  const { error } = await supabase.rpc('mark_notifications_read', { p_all: true })
  if (error) throw error
}
