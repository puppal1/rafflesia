// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T21:35:00-08:00 — larger builtin list + teacher DB phrases for all text
import { BUILTIN_BAD_PHRASES, phraseMatchesText } from './badWords'
import { supabase } from './supabase'

export type TextCheckResult =
  | { ok: true }
  | { ok: false; matched: string; message: string }

let cachedPhrases: string[] | null = null

/** created: 2026-11-23T21:00:00-08:00 */
export async function loadBlockedPhrases(): Promise<string[]> {
  if (cachedPhrases) return cachedPhrases
  const { data, error } = await supabase.rpc('list_blocked_phrases')
  if (!error && Array.isArray(data) && data.length) {
    cachedPhrases = [
      ...new Set([...BUILTIN_BAD_PHRASES, ...(data as string[]).map((p) => String(p).toLowerCase())]),
    ]
    return cachedPhrases
  }
  cachedPhrases = [...BUILTIN_BAD_PHRASES]
  return cachedPhrases
}

/** created: 2026-11-23T21:00:00-08:00 */
export function clearBlockedPhraseCache() {
  cachedPhrases = null
}

/** created: 2026-11-23T21:00:00-08:00 */
/** updated: 2026-11-23T21:35:00-08:00 — messages, bios, posts, names */
export async function checkKidText(raw: string): Promise<TextCheckResult> {
  const text = (raw || '').trim()
  if (!text) return { ok: true }

  const phrases = await loadBlockedPhrases()
  for (const phrase of phrases) {
    if (phraseMatchesText(text, phrase)) {
      return {
        ok: false,
        matched: phrase,
        message: "Let's keep it kind. That text couldn't be saved. Edit your words and try again.",
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
