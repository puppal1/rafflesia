// created: 2026-11-25T01:25:00-08:00 — PRD v4 J1: private DM unread only
import { supabase } from './supabase'

/** created: 2026-11-25T01:25:00-08:00 */
export async function countMyUnreadDms(): Promise<number> {
  const { data, error } = await supabase.rpc('count_my_unread_dms')
  if (error) {
    if (/count_my_unread_dms|schema cache/i.test(error.message)) return 0
    throw error
  }
  return Number(data || 0)
}

/** created: 2026-11-25T01:25:00-08:00 */
export async function listMyDmUnreadCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.rpc('list_my_dm_unread_counts')
  if (error) {
    if (/list_my_dm_unread_counts|schema cache/i.test(error.message)) return {}
    throw error
  }
  const out: Record<string, number> = {}
  for (const row of (data || []) as { chat_id: string; unread_count: number }[]) {
    out[String(row.chat_id)] = Number(row.unread_count || 0)
  }
  return out
}

/** created: 2026-11-25T01:25:00-08:00 */
export async function markDmRead(chatId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_dm_read', { p_chat_id: chatId })
  if (error && !/mark_dm_read|schema cache/i.test(error.message)) throw error
}
