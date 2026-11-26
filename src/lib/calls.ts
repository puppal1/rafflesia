// created: 2026-11-25T20:40:00-08:00 — PRD v5 call session helpers
import { supabase } from './supabase'

export type CallMode = 'voice' | 'video'

export type CallSession = {
  // created: 2026-11-25T20:40:00-08:00
  id: string
  chat_id: string
  created_by: string
  mode: CallMode
  room_slug: string
  status: 'active' | 'ended'
  created_at: string
  ended_at: string | null
}

const CALL_MSG_RE = /^@@call:([0-9a-f-]{36}):(voice|video)@@/i

/** created: 2026-11-25T20:40:00-08:00 */
export function parseCallMessage(body: string | null | undefined): {
  callId: string
  mode: CallMode
} | null {
  if (!body) return null
  const m = body.trim().match(CALL_MSG_RE)
  if (!m) return null
  return { callId: m[1], mode: m[2].toLowerCase() as CallMode }
}

/** created: 2026-11-25T20:40:00-08:00 */
export function jitsiRoomName(slug: string): string {
  return `Rafflesia${slug}`
}

/** created: 2026-11-25T20:40:00-08:00 */
export async function startChatCall(chatId: string, mode: CallMode = 'voice'): Promise<CallSession> {
  // updated: 2026-11-25T20:45:00-08:00 — app always requests voice
  const { data, error } = await supabase.rpc('start_chat_call', {
    p_chat_id: chatId,
    p_mode: 'voice',
  })
  void mode
  if (error) {
    if (/start_chat_call|schema cache/i.test(error.message)) {
      throw new Error('Calls need sql/prd-v5-calls.sql — run in Supabase.')
    }
    throw error
  }
  return data as CallSession
}

/** created: 2026-11-25T20:40:00-08:00 */
export async function endChatCall(callId: string): Promise<void> {
  const { error } = await supabase.rpc('end_chat_call', { p_call_id: callId })
  if (error && !/end_chat_call|schema cache/i.test(error.message)) throw error
}

/** created: 2026-11-25T20:40:00-08:00 */
export async function getActiveChatCall(chatId: string): Promise<CallSession | null> {
  const { data, error } = await supabase.rpc('get_active_chat_call', { p_chat_id: chatId })
  if (error) {
    if (/get_active_chat_call|schema cache/i.test(error.message)) return null
    throw error
  }
  return (data as CallSession) || null
}

/** created: 2026-11-25T20:40:00-08:00 */
export async function listMyRingingCalls(): Promise<CallSession[]> {
  const { data, error } = await supabase.rpc('list_my_ringing_calls')
  if (error) {
    if (/list_my_ringing_calls|schema cache/i.test(error.message)) return []
    throw error
  }
  return (data || []) as CallSession[]
}
