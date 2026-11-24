// created: 2026-11-23T21:35:00-08:00
// Shared school-safe blocklist (client fallback + seed mirror)

/** created: 2026-11-23T21:35:00-08:00 — larger than first cut; teacher DB list adds more */
export const BUILTIN_BAD_PHRASES = [
  'fuck',
  'fucker',
  'fucking',
  'shit',
  'bitch',
  'asshole',
  'bastard',
  'dick',
  'cock',
  'pussy',
  'cunt',
  'slut',
  'whore',
  'rape',
  'retard',
  'retarded',
  'nigger',
  'nigga',
  'faggot',
  'fag',
  'suicide',
  'killme',
  'killyou',
  'kill you',
  'kill yourself',
  'kill myself',
  'i will kill',
  'want you dead',
  'go die',
  'die bitch',
  'kys',
  'hate you',
  'i hate you',
  'shut up idiot',
  'you suck',
  'stupid bitch',
]

/** created: 2026-11-23T21:35:00-08:00 */
export function normalizeKidText(s: string) {
  return s.trim().toLowerCase()
}

/** created: 2026-11-23T21:35:00-08:00 — username-safe: strip non-alnum */
export function normalizeUsernameKey(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
}

/** created: 2026-11-23T21:35:00-08:00 */
export function phraseMatchesText(text: string, phrase: string): boolean {
  const p = phrase.trim().toLowerCase()
  if (!p) return false
  const lower = normalizeKidText(text)
  if (lower.includes(p)) return true
  // usernames: "killyou" vs "kill you"
  const compactText = normalizeUsernameKey(text)
  const compactPhrase = p.replace(/[^a-z0-9]/g, '')
  return Boolean(compactPhrase && compactText.includes(compactPhrase))
}
