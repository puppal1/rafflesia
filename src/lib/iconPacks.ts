// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T23:55:00-08:00 — regular emojis only (no AI jpg icons)
// updated: 2026-11-24T12:40:00-08:00 — manga sticker packs + imageUrl (PRD v2 C3)

export type IconDef = {
  // created: 2026-11-23T21:00:00-08:00
  id: string
  pack: string
  emoji: string
  label: string
  /** created: 2026-11-24T12:40:00-08:00 — optional manga bust under public/manga-icons */
  imageUrl?: string
}

const base = import.meta.env.BASE_URL || '/'

/** created: 2026-11-24T12:40:00-08:00 */
function manga(path: string): string {
  return `${base}manga-icons/${path}`
}

/** created: 2026-11-23T21:00:00-08:00 */
/** updated: 2026-11-23T23:55:00-08:00 — emoji-only packs */
/** updated: 2026-11-24T12:40:00-08:00 — manga packs first */
export const ICON_PACKS: { id: string; title: string; icons: IconDef[] }[] = [
  {
    id: 'manga-hero',
    title: 'Manga Hero',
    icons: [
      { id: 'manga-hero-1', pack: 'manga-hero', emoji: '🦸', label: 'hero', imageUrl: manga('hero.jpg') },
      { id: 'manga-hero-sky', pack: 'manga-hero', emoji: '☀️', label: 'sky', imageUrl: manga('hero.jpg') },
    ],
  },
  {
    id: 'manga-villain',
    title: 'Manga Villain',
    icons: [
      { id: 'manga-villain-1', pack: 'manga-villain', emoji: '😈', label: 'villain', imageUrl: manga('villain.jpg') },
      { id: 'manga-villain-night', pack: 'manga-villain', emoji: '🌑', label: 'night', imageUrl: manga('villain.jpg') },
    ],
  },
  {
    id: 'manga-neutral',
    title: 'Manga Neutral',
    icons: [
      { id: 'manga-neutral-1', pack: 'manga-neutral', emoji: '😊', label: 'friend', imageUrl: manga('neutral.jpg') },
      { id: 'manga-neutral-garden', pack: 'manga-neutral', emoji: '🌿', label: 'garden', imageUrl: manga('neutral.jpg') },
    ],
  },
  {
    id: 'dino',
    title: 'Dino',
    icons: [
      { id: 'dino-smile', pack: 'dino', emoji: '🦕', label: 'dino' },
      { id: 'dino-egg', pack: 'dino', emoji: '🥚', label: 'egg' },
      { id: 'dino-leaf', pack: 'dino', emoji: '🌿', label: 'leaf' },
    ],
  },
  {
    id: 'flower',
    title: 'Flower',
    icons: [
      { id: 'flower-blue', pack: 'flower', emoji: '🌸', label: 'flower' },
      { id: 'flower-petal', pack: 'flower', emoji: '🌼', label: 'petal' },
      { id: 'flower-sprout', pack: 'flower', emoji: '🌱', label: 'sprout' },
    ],
  },
  {
    id: 'space',
    title: 'Space',
    icons: [
      { id: 'space-planet', pack: 'space', emoji: '🪐', label: 'planet' },
      { id: 'space-star', pack: 'space', emoji: '⭐', label: 'star' },
      { id: 'space-moon', pack: 'space', emoji: '🌙', label: 'moon' },
    ],
  },
  {
    id: 'snack',
    title: 'Snack',
    icons: [
      { id: 'snack-boba', pack: 'snack', emoji: '🧋', label: 'boba' },
      { id: 'snack-donut', pack: 'snack', emoji: '🍩', label: 'donut' },
      { id: 'snack-cookie', pack: 'snack', emoji: '🍪', label: 'cookie' },
    ],
  },
  {
    id: 'sport',
    title: 'Sport',
    icons: [
      { id: 'sport-ball', pack: 'sport', emoji: '⚽', label: 'soccer' },
      { id: 'sport-shoe', pack: 'sport', emoji: '👟', label: 'sneaker' },
      { id: 'sport-trophy', pack: 'sport', emoji: '🏆', label: 'trophy' },
    ],
  },
]

/** created: 2026-11-23T21:00:00-08:00 */
export function allIcons(): IconDef[] {
  return ICON_PACKS.flatMap((p) => p.icons)
}

/** created: 2026-11-23T21:00:00-08:00 */
export function findIcon(pack?: string | null, id?: string | null): IconDef | undefined {
  if (!id) return undefined
  return allIcons().find((i) => i.id === id || (pack && i.pack === pack && i.id === id))
}

/** created: 2026-11-23T21:00:00-08:00 */
export function iconEmoji(pack?: string | null, id?: string | null): string {
  return findIcon(pack, id)?.emoji || '🙂'
}

/** created: 2026-11-24T12:40:00-08:00 */
export function iconImageUrl(pack?: string | null, id?: string | null): string | undefined {
  return findIcon(pack, id)?.imageUrl
}
