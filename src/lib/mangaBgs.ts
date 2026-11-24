// created: 2026-11-24T12:55:00-08:00 — selectable manga full-screen backgrounds (PRD v2 C2)
// updated: 2026-11-24T13:50:00-08:00 — character stickers as backgrounds too

export type MangaBgId =
  | 'none'
  | 'hero-sky'
  | 'hero-sunset'
  | 'villain-night'
  | 'villain-shadow'
  | 'neutral-garden'
  | 'neutral-street'
  | 'char-hero'
  | 'char-lockin'
  | 'char-aura'
  | 'char-mainchar'
  | 'char-sigma'
  | 'char-glaze'
  | 'char-villain'
  | 'char-ragebait'
  | 'char-doomscroll'
  | 'char-caplord'
  | 'char-mogger'
  | 'char-sidequest'
  | 'char-friend'
  | 'char-chillguy'
  | 'char-mewing'
  | 'char-delulu'
  | 'char-npc'
  | 'char-lore'

export type MangaBgDef = {
  // created: 2026-11-24T12:55:00-08:00
  id: MangaBgId
  name: string
  group: 'off' | 'hero' | 'villain' | 'neutral' | 'character'
  /** folder under public/ */
  folder: 'theme-bgs' | 'manga-icons'
  /** filename, or empty for none */
  file: string
}

/** created: 2026-11-24T12:55:00-08:00 */
/** updated: 2026-11-24T13:50:00-08:00 */
export const MANGA_BGS: MangaBgDef[] = [
  { id: 'none', name: 'No picture', group: 'off', folder: 'theme-bgs', file: '' },
  { id: 'hero-sky', name: 'Hero sky', group: 'hero', folder: 'theme-bgs', file: 'hero-sky.jpg' },
  { id: 'hero-sunset', name: 'Hero sunset', group: 'hero', folder: 'theme-bgs', file: 'hero-sunset.jpg' },
  { id: 'villain-night', name: 'Villain night', group: 'villain', folder: 'theme-bgs', file: 'villain-night.jpg' },
  { id: 'villain-shadow', name: 'Villain shadow', group: 'villain', folder: 'theme-bgs', file: 'villain-shadow.jpg' },
  { id: 'neutral-garden', name: 'Neutral garden', group: 'neutral', folder: 'theme-bgs', file: 'neutral-garden.jpg' },
  { id: 'neutral-street', name: 'Neutral street', group: 'neutral', folder: 'theme-bgs', file: 'neutral-street.jpg' },
  // character stickers as full-screen BGs
  { id: 'char-hero', name: 'Hero', group: 'character', folder: 'manga-icons', file: 'hero.jpg' },
  { id: 'char-lockin', name: 'Lock-In Lance', group: 'character', folder: 'manga-icons', file: 'hero-lockin.jpg' },
  { id: 'char-aura', name: 'Aura Mira', group: 'character', folder: 'manga-icons', file: 'hero-aura.jpg' },
  { id: 'char-mainchar', name: 'Mainchar Nova', group: 'character', folder: 'manga-icons', file: 'hero-mainchar.jpg' },
  { id: 'char-sigma', name: 'Sigma Zen', group: 'character', folder: 'manga-icons', file: 'hero-sigma.jpg' },
  { id: 'char-glaze', name: 'Glaze Rio', group: 'character', folder: 'manga-icons', file: 'hero-glaze.jpg' },
  { id: 'char-villain', name: 'Villain', group: 'character', folder: 'manga-icons', file: 'villain.jpg' },
  { id: 'char-ragebait', name: 'Ragebait Kuro', group: 'character', folder: 'manga-icons', file: 'villain-ragebait.jpg' },
  { id: 'char-doomscroll', name: 'Doomscroll Vex', group: 'character', folder: 'manga-icons', file: 'villain-doomscroll.jpg' },
  { id: 'char-caplord', name: 'Caplord Nyx', group: 'character', folder: 'manga-icons', file: 'villain-caplord.jpg' },
  { id: 'char-mogger', name: 'Mogger Drekk', group: 'character', folder: 'manga-icons', file: 'villain-mogger.jpg' },
  { id: 'char-sidequest', name: 'Sidequest Zara', group: 'character', folder: 'manga-icons', file: 'villain-sidequest.jpg' },
  { id: 'char-friend', name: 'Friend', group: 'character', folder: 'manga-icons', file: 'neutral.jpg' },
  { id: 'char-chillguy', name: 'Chillguy Hana', group: 'character', folder: 'manga-icons', file: 'neutral-chillguy.jpg' },
  { id: 'char-mewing', name: 'Mewing Jun', group: 'character', folder: 'manga-icons', file: 'neutral-mewing.jpg' },
  { id: 'char-delulu', name: 'Delulu Yuki', group: 'character', folder: 'manga-icons', file: 'neutral-delulu.jpg' },
  { id: 'char-npc', name: 'NPC Ken', group: 'character', folder: 'manga-icons', file: 'neutral-npc.jpg' },
  { id: 'char-lore', name: 'Lore Sora', group: 'character', folder: 'manga-icons', file: 'neutral-lore.jpg' },
]

/** created: 2026-11-24T12:55:00-08:00 */
export function mangaBgById(id: string | null | undefined): MangaBgDef {
  return MANGA_BGS.find((b) => b.id === id) || MANGA_BGS[0]
}
