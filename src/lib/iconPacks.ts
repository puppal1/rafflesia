// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T21:40:00-08:00 — PNG assets under public/icons/ with emoji fallback

export type IconDef = {
  // created: 2026-11-23T21:00:00-08:00
  id: string
  pack: string
  emoji: string
  label: string
  /** created: 2026-11-23T21:40:00-08:00 — path under BASE_URL */
  src?: string
}

/** created: 2026-11-23T21:40:00-08:00 */
function iconSrc(file: string) {
  return `${import.meta.env.BASE_URL}icons/${file}`
}

/** created: 2026-11-23T21:00:00-08:00 */
/** updated: 2026-11-23T21:40:00-08:00 — jpg badge assets */
export const ICON_PACKS: { id: string; title: string; icons: IconDef[] }[] = [
  {
    id: 'dino',
    title: 'Dino',
    icons: [
      { id: 'dino-smile', pack: 'dino', emoji: '🦕', label: 'dino', src: iconSrc('dino-smile.jpg') },
      { id: 'dino-egg', pack: 'dino', emoji: '🥚', label: 'egg', src: iconSrc('dino-egg.jpg') },
      { id: 'dino-leaf', pack: 'dino', emoji: '🌿', label: 'leaf', src: iconSrc('dino-leaf.jpg') },
    ],
  },
  {
    id: 'flower',
    title: 'Flower',
    icons: [
      { id: 'flower-blue', pack: 'flower', emoji: '🌸', label: 'flower', src: iconSrc('flower-blue.jpg') },
      { id: 'flower-petal', pack: 'flower', emoji: '🌼', label: 'petal', src: iconSrc('flower-petal.jpg') },
      { id: 'flower-sprout', pack: 'flower', emoji: '🌱', label: 'sprout', src: iconSrc('flower-sprout.jpg') },
    ],
  },
  {
    id: 'space',
    title: 'Space',
    icons: [
      { id: 'space-planet', pack: 'space', emoji: '🪐', label: 'planet', src: iconSrc('space-planet.jpg') },
      { id: 'space-star', pack: 'space', emoji: '⭐', label: 'star', src: iconSrc('space-star.jpg') },
      { id: 'space-moon', pack: 'space', emoji: '🌙', label: 'moon', src: iconSrc('space-moon.jpg') },
    ],
  },
  {
    id: 'snack',
    title: 'Snack',
    icons: [
      { id: 'snack-boba', pack: 'snack', emoji: '🧋', label: 'boba', src: iconSrc('snack-boba.jpg') },
      { id: 'snack-donut', pack: 'snack', emoji: '🍩', label: 'donut', src: iconSrc('snack-donut.jpg') },
      { id: 'snack-cookie', pack: 'snack', emoji: '🍪', label: 'cookie', src: iconSrc('snack-cookie.jpg') },
    ],
  },
  {
    id: 'sport',
    title: 'Sport',
    icons: [
      { id: 'sport-ball', pack: 'sport', emoji: '⚽', label: 'soccer', src: iconSrc('sport-ball.jpg') },
      { id: 'sport-shoe', pack: 'sport', emoji: '👟', label: 'sneaker', src: iconSrc('sport-shoe.jpg') },
      { id: 'sport-trophy', pack: 'sport', emoji: '🏆', label: 'trophy', src: iconSrc('sport-trophy.jpg') },
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

/** created: 2026-11-23T21:40:00-08:00 */
export function iconSrcOrEmpty(pack?: string | null, id?: string | null): string | undefined {
  return findIcon(pack, id)?.src
}
