// created: 2026-11-25T01:25:00-08:00 — PRD v4 J5 lounge polls
import { supabase } from './supabase'

export type PollOption = {
  // created: 2026-11-25T01:25:00-08:00
  id: string
  label: string
  sort_order: number
  votes: number
}

export type ChatPoll = {
  // created: 2026-11-25T01:25:00-08:00
  id: string
  chat_id: string
  created_by: string
  question: string
  closed_at: string | null
  created_at: string
  my_option_id: string | null
  options: PollOption[]
}

const POLL_RE = /^@@poll:([0-9a-f-]{36})@@$/i

/** created: 2026-11-25T01:25:00-08:00 */
export function parsePollMessage(body: string | null | undefined): string | null {
  if (!body) return null
  const m = body.trim().match(POLL_RE)
  return m ? m[1] : null
}

/** created: 2026-11-25T01:25:00-08:00 */
export async function createChatPoll(
  chatId: string,
  question: string,
  options: string[],
): Promise<string> {
  const { data, error } = await supabase.rpc('create_chat_poll', {
    p_chat_id: chatId,
    p_question: question,
    p_options: options,
  })
  if (error) {
    if (/create_chat_poll|schema cache/i.test(error.message)) {
      throw new Error('Polls need sql/prd-v4.sql — run in Supabase.')
    }
    throw error
  }
  return String(data)
}

/** created: 2026-11-25T01:25:00-08:00 */
export async function getChatPoll(pollId: string): Promise<ChatPoll> {
  const { data, error } = await supabase.rpc('get_chat_poll', { p_poll_id: pollId })
  if (error) throw error
  return data as ChatPoll
}

/** created: 2026-11-25T01:25:00-08:00 */
export async function voteChatPoll(pollId: string, optionId: string): Promise<void> {
  const { error } = await supabase.rpc('vote_chat_poll', {
    p_poll_id: pollId,
    p_option_id: optionId,
  })
  if (error) throw error
}

/** created: 2026-11-25T01:25:00-08:00 */
export async function closeChatPoll(pollId: string): Promise<void> {
  const { error } = await supabase.rpc('close_chat_poll', { p_poll_id: pollId })
  if (error) throw error
}
