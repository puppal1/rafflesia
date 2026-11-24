// created: 2026-11-23T21:00:00-08:00
// Calm text checker for messages, bios, posts (client + optional DB phrases)

import { containsBadWord } from './usernameRules'
import { supabase } from './supabase'

export type TextCheckResult =
  | { ok: true }
  | { ok: false; matched: string; message: string }

/** created: 2026-11-23T21:00:00-08:00 */
const EXTRA_PHRASES = ['kill you', 'kys', 'hate you', 'go die']

let cachedPhrases: string[] | null = null

/** created: 2026-11-23T21:00:00-08:00 */
export async function loadBlockedPhrases(): Promise<string[]> {
  if (cachedPhrases) return cachedPhrases
  const { data, error } = await supabase.rpc('list_blocked_phrases')
  if (!error && Array.isArray(data)) {
    cachedPhrases = (data as string[]).map((p) => String(p).toLowerCase())
    return cachedPhrases
  }
  cachedPhrases = [...EXTRA_PHRASES]
  return cachedPhrases
}

/** created: 2026-11-23T21:00:00-08:00 */
export function clearBlockedPhraseCache() {
  cachedPhrases = null
}

/** created: 2026-11-23T21:00:00-08:00 */
export async function checkKidText(raw: string): Promise<TextCheckResult> {
  const text = (raw || '').trim()
  if (!text) return { ok: true }

  if (containsBadWord(text)) {
    return {
      ok: false,
      matched: 'blocked-word',
      message: "Let's keep it kind. That message couldn't be sent. Edit your words and try again.",
    }
  }

  const lower = text.toLowerCase()
  const phrases = await loadBlockedPhrases()
  for (const phrase of phrases) {
    if (phrase && lower.includes(phrase)) {
      return {
        ok: false,
        matched: phrase,
        message: "Let's keep it kind. That message couldn't be sent. Edit your words and try again.",
      }
    }
  }
  return { ok: true }
}

/** created: 2026-11-23T21:00:00-08:00 */
export async function reportBlockedText(context: string, body: string, matched: string) {
  try {
    await supabase.rpc('flag_blocked_text', {
      p_context: context,
      p_body: body,
      p_matched: matched,
    })
  } catch {
    /* non-fatal */
  }
}
