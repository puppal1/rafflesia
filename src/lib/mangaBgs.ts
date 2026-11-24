// created: 2026-11-24T12:55:00-08:00 — selectable manga full-screen backgrounds (PRD v2 C2)

export type MangaBgId = 'none' | 'hero-sky' | 'hero-sunset' | 'villain-night' | 'villain-shadow' | 'neutral-garden' | 'neutral-street'

export type MangaBgDef = {
  // created: 2026-11-24T12:55:00-08:00
  id: MangaBgId
  name: string
  group: 'off' | 'hero' | 'villain' | 'neutral'
  /** file under public/theme-bgs, or empty for none */
  file: string
}

/** created: 2026-11-24T12:55:00-08:00 */
export const MANGA_BGS: MangaBgDef[] = [
  { id: 'none', name: 'No picture', group: 'off', file: '' },
  { id: 'hero-sky', name: 'Hero sky', group: 'hero', file: 'hero-sky.jpg' },
  { id: 'hero-sunset', name: 'Hero sunset', group: 'hero', file: 'hero-sunset.jpg' },
  { id: 'villain-night', name: 'Villain night', group: 'villain', file: 'villain-night.jpg' },
  { id: 'villain-shadow', name: 'Villain shadow', group: 'villain', file: 'villain-shadow.jpg' },
  { id: 'neutral-garden', name: 'Neutral garden', group: 'neutral', file: 'neutral-garden.jpg' },
  { id: 'neutral-street', name: 'Neutral street', group: 'neutral', file: 'neutral-street.jpg' },
]

/** created: 2026-11-24T12:55:00-08:00 */
export function mangaBgById(id: string | null | undefined): MangaBgDef {
  return MANGA_BGS.find((b) => b.id === id) || MANGA_BGS[0]
}
