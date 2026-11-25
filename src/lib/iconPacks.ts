// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T23:55:00-08:00 — regular emojis only (no AI jpg icons)
// updated: 2026-11-24T12:40:00-08:00 — manga sticker packs + imageUrl (PRD v2 C3)
// updated: 2026-11-24T13:45:00-08:00 — +5 meme×manga icons per hero/villain/neutral
// updated: 2026-11-24T22:30:00-08:00 — more emoji packs + faith & civic manga stickers

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
/** updated: 2026-11-24T22:30:00-08:00 — emoji categories + faith/civic manga */
export const ICON_PACKS: { id: string; title: string; icons: IconDef[] }[] = [
  {
    id: 'manga-hero',
    title: 'Manga Hero',
    icons: [
      { id: 'manga-hero-1', pack: 'manga-hero', emoji: '🦸', label: 'hero', imageUrl: manga('hero.jpg') },
      { id: 'manga-hero-lockin', pack: 'manga-hero', emoji: '🔒', label: 'Lock-In Lance', imageUrl: manga('hero-lockin.jpg') },
      { id: 'manga-hero-aura', pack: 'manga-hero', emoji: '✨', label: 'Aura Mira', imageUrl: manga('hero-aura.jpg') },
      { id: 'manga-hero-mainchar', pack: 'manga-hero', emoji: '🌟', label: 'Mainchar Nova', imageUrl: manga('hero-mainchar.jpg') },
      { id: 'manga-hero-sigma', pack: 'manga-hero', emoji: '⚡', label: 'Sigma Zen', imageUrl: manga('hero-sigma.jpg') },
      { id: 'manga-hero-glaze', pack: 'manga-hero', emoji: '🎧', label: 'Glaze Rio', imageUrl: manga('hero-glaze.jpg') },
    ],
  },
  {
    id: 'manga-villain',
    title: 'Manga Villain',
    icons: [
      { id: 'manga-villain-1', pack: 'manga-villain', emoji: '😈', label: 'villain', imageUrl: manga('villain.jpg') },
      { id: 'manga-villain-ragebait', pack: 'manga-villain', emoji: '🎣', label: 'Ragebait Kuro', imageUrl: manga('villain-ragebait.jpg') },
      { id: 'manga-villain-doomscroll', pack: 'manga-villain', emoji: '📱', label: 'Doomscroll Vex', imageUrl: manga('villain-doomscroll.jpg') },
      { id: 'manga-villain-caplord', pack: 'manga-villain', emoji: '🧢', label: 'Caplord Nyx', imageUrl: manga('villain-caplord.jpg') },
      { id: 'manga-villain-mogger', pack: 'manga-villain', emoji: '🕶️', label: 'Mogger Drekk', imageUrl: manga('villain-mogger.jpg') },
      { id: 'manga-villain-sidequest', pack: 'manga-villain', emoji: '🗺️', label: 'Sidequest Zara', imageUrl: manga('villain-sidequest.jpg') },
    ],
  },
  {
    id: 'manga-neutral',
    title: 'Manga Neutral',
    icons: [
      { id: 'manga-neutral-1', pack: 'manga-neutral', emoji: '😊', label: 'friend', imageUrl: manga('neutral.jpg') },
      { id: 'manga-neutral-chillguy', pack: 'manga-neutral', emoji: '😌', label: 'Chillguy Hana', imageUrl: manga('neutral-chillguy.jpg') },
      { id: 'manga-neutral-mewing', pack: 'manga-neutral', emoji: '🦊', label: 'Mewing Jun', imageUrl: manga('neutral-mewing.jpg') },
      { id: 'manga-neutral-delulu', pack: 'manga-neutral', emoji: '💭', label: 'Delulu Yuki', imageUrl: manga('neutral-delulu.jpg') },
      { id: 'manga-neutral-npc', pack: 'manga-neutral', emoji: '🎒', label: 'NPC Ken', imageUrl: manga('neutral-npc.jpg') },
      { id: 'manga-neutral-lore', pack: 'manga-neutral', emoji: '📖', label: 'Lore Sora', imageUrl: manga('neutral-lore.jpg') },
    ],
  },
  // created: 2026-11-24T22:30:00-08:00 — inclusive peaceful faith stickers (fictional)
  {
    id: 'manga-faith',
    title: 'Manga Faith',
    icons: [
      { id: 'manga-faith-lotus', pack: 'manga-faith', emoji: '🪷', label: 'Lotus Lina', imageUrl: manga('faith-lotus.jpg') },
      { id: 'manga-faith-candle', pack: 'manga-faith', emoji: '🕯️', label: 'Candle Kai', imageUrl: manga('faith-candle.jpg') },
      { id: 'manga-faith-dove', pack: 'manga-faith', emoji: '🕊️', label: 'Dove Dani', imageUrl: manga('faith-dove.jpg') },
      { id: 'manga-faith-star', pack: 'manga-faith', emoji: '✡️', label: 'Star Sam' },
      { id: 'manga-faith-crescent', pack: 'manga-faith', emoji: '🌙', label: 'Crescent Cam' },
      { id: 'manga-faith-om', pack: 'manga-faith', emoji: '🕉️', label: 'Om Ari' },
    ],
  },
  // created: 2026-11-24T22:30:00-08:00 — non-partisan civics / political classroom stickers
  {
    id: 'manga-civic',
    title: 'Manga Civic',
    icons: [
      { id: 'manga-civic-ballot', pack: 'manga-civic', emoji: '🗳️', label: 'Ballot Bea', imageUrl: manga('civic-ballot.jpg') },
      { id: 'manga-civic-debate', pack: 'manga-civic', emoji: '🎤', label: 'Debate Dex', imageUrl: manga('civic-debate.jpg') },
      { id: 'manga-civic-townhall', pack: 'manga-civic', emoji: '🏛️', label: 'Townhall Tess', imageUrl: manga('civic-townhall.jpg') },
      { id: 'manga-civic-fair', pack: 'manga-civic', emoji: '⚖️', label: 'Fair Play Finn' },
      { id: 'manga-civic-listen', pack: 'manga-civic', emoji: '👂', label: 'Listen Lex' },
      { id: 'manga-civic-flag', pack: 'manga-civic', emoji: '🏳️', label: 'Unity Uma' },
    ],
  },
  {
    id: 'dino',
    title: 'Dino',
    icons: [
      { id: 'dino-smile', pack: 'dino', emoji: '🦕', label: 'dino' },
      { id: 'dino-egg', pack: 'dino', emoji: '🥚', label: 'egg' },
      { id: 'dino-leaf', pack: 'dino', emoji: '🌿', label: 'leaf' },
      { id: 'dino-rex', pack: 'dino', emoji: '🦖', label: 'rex' },
      { id: 'dino-bone', pack: 'dino', emoji: '🦴', label: 'bone' },
    ],
  },
  {
    id: 'flower',
    title: 'Flower',
    icons: [
      { id: 'flower-blue', pack: 'flower', emoji: '🌸', label: 'flower' },
      { id: 'flower-petal', pack: 'flower', emoji: '🌼', label: 'petal' },
      { id: 'flower-sprout', pack: 'flower', emoji: '🌱', label: 'sprout' },
      { id: 'flower-rose', pack: 'flower', emoji: '🌹', label: 'rose' },
      { id: 'flower-sun', pack: 'flower', emoji: '🌻', label: 'sunflower' },
      { id: 'flower-tulip', pack: 'flower', emoji: '🌷', label: 'tulip' },
    ],
  },
  {
    id: 'space',
    title: 'Space',
    icons: [
      { id: 'space-planet', pack: 'space', emoji: '🪐', label: 'planet' },
      { id: 'space-star', pack: 'space', emoji: '⭐', label: 'star' },
      { id: 'space-moon', pack: 'space', emoji: '🌙', label: 'moon' },
      { id: 'space-rocket', pack: 'space', emoji: '🚀', label: 'rocket' },
      { id: 'space-alien', pack: 'space', emoji: '👽', label: 'alien' },
      { id: 'space-comet', pack: 'space', emoji: '☄️', label: 'comet' },
    ],
  },
  {
    id: 'snack',
    title: 'Snack',
    icons: [
      { id: 'snack-boba', pack: 'snack', emoji: '🧋', label: 'boba' },
      { id: 'snack-donut', pack: 'snack', emoji: '🍩', label: 'donut' },
      { id: 'snack-cookie', pack: 'snack', emoji: '🍪', label: 'cookie' },
      { id: 'snack-pizza', pack: 'snack', emoji: '🍕', label: 'pizza' },
      { id: 'snack-taco', pack: 'snack', emoji: '🌮', label: 'taco' },
      { id: 'snack-icecream', pack: 'snack', emoji: '🍦', label: 'ice cream' },
    ],
  },
  {
    id: 'sport',
    title: 'Sport',
    icons: [
      { id: 'sport-ball', pack: 'sport', emoji: '⚽', label: 'soccer' },
      { id: 'sport-shoe', pack: 'sport', emoji: '👟', label: 'sneaker' },
      { id: 'sport-trophy', pack: 'sport', emoji: '🏆', label: 'trophy' },
      { id: 'sport-basket', pack: 'sport', emoji: '🏀', label: 'basketball' },
      { id: 'sport-tennis', pack: 'sport', emoji: '🎾', label: 'tennis' },
      { id: 'sport-swim', pack: 'sport', emoji: '🏊', label: 'swim' },
    ],
  },
  // created: 2026-11-24T22:30:00-08:00 — extra non-manga emoji categories
  {
    id: 'animals',
    title: 'Animals',
    icons: [
      { id: 'animals-cat', pack: 'animals', emoji: '🐱', label: 'cat' },
      { id: 'animals-dog', pack: 'animals', emoji: '🐶', label: 'dog' },
      { id: 'animals-fox', pack: 'animals', emoji: '🦊', label: 'fox' },
      { id: 'animals-panda', pack: 'animals', emoji: '🐼', label: 'panda' },
      { id: 'animals-owl', pack: 'animals', emoji: '🦉', label: 'owl' },
      { id: 'animals-dolphin', pack: 'animals', emoji: '🐬', label: 'dolphin' },
    ],
  },
  {
    id: 'music',
    title: 'Music',
    icons: [
      { id: 'music-notes', pack: 'music', emoji: '🎵', label: 'notes' },
      { id: 'music-guitar', pack: 'music', emoji: '🎸', label: 'guitar' },
      { id: 'music-drums', pack: 'music', emoji: '🥁', label: 'drums' },
      { id: 'music-mic', pack: 'music', emoji: '🎤', label: 'mic' },
      { id: 'music-headphones', pack: 'music', emoji: '🎧', label: 'headphones' },
      { id: 'music-piano', pack: 'music', emoji: '🎹', label: 'piano' },
    ],
  },
  {
    id: 'school',
    title: 'School',
    icons: [
      { id: 'school-book', pack: 'school', emoji: '📚', label: 'books' },
      { id: 'school-pencil', pack: 'school', emoji: '✏️', label: 'pencil' },
      { id: 'school-backpack', pack: 'school', emoji: '🎒', label: 'backpack' },
      { id: 'school-art', pack: 'school', emoji: '🎨', label: 'art' },
      { id: 'school-science', pack: 'school', emoji: '🔬', label: 'science' },
      { id: 'school-globe', pack: 'school', emoji: '🌍', label: 'globe' },
    ],
  },
  {
    id: 'ocean',
    title: 'Ocean',
    icons: [
      { id: 'ocean-wave', pack: 'ocean', emoji: '🌊', label: 'wave' },
      { id: 'ocean-fish', pack: 'ocean', emoji: '🐟', label: 'fish' },
      { id: 'ocean-whale', pack: 'ocean', emoji: '🐋', label: 'whale' },
      { id: 'ocean-shell', pack: 'ocean', emoji: '🐚', label: 'shell' },
      { id: 'ocean-anchor', pack: 'ocean', emoji: '⚓', label: 'anchor' },
      { id: 'ocean-boat', pack: 'ocean', emoji: '⛵', label: 'boat' },
    ],
  },
  {
    id: 'weather',
    title: 'Weather',
    icons: [
      { id: 'weather-sun', pack: 'weather', emoji: '☀️', label: 'sun' },
      { id: 'weather-cloud', pack: 'weather', emoji: '⛅', label: 'cloud' },
      { id: 'weather-rain', pack: 'weather', emoji: '🌧️', label: 'rain' },
      { id: 'weather-rainbow', pack: 'weather', emoji: '🌈', label: 'rainbow' },
      { id: 'weather-snow', pack: 'weather', emoji: '❄️', label: 'snow' },
      { id: 'weather-wind', pack: 'weather', emoji: '💨', label: 'wind' },
    ],
  },
  {
    id: 'tech',
    title: 'Tech',
    icons: [
      { id: 'tech-robot', pack: 'tech', emoji: '🤖', label: 'robot' },
      { id: 'tech-computer', pack: 'tech', emoji: '💻', label: 'laptop' },
      { id: 'tech-game', pack: 'tech', emoji: '🎮', label: 'game' },
      { id: 'tech-phone', pack: 'tech', emoji: '📱', label: 'phone' },
      { id: 'tech-camera', pack: 'tech', emoji: '📷', label: 'camera' },
      { id: 'tech-bulb', pack: 'tech', emoji: '💡', label: 'idea' },
    ],
  },
  {
    id: 'faces',
    title: 'Faces',
    icons: [
      { id: 'faces-smile', pack: 'faces', emoji: '😀', label: 'smile' },
      { id: 'faces-cool', pack: 'faces', emoji: '😎', label: 'cool' },
      { id: 'faces-think', pack: 'faces', emoji: '🤔', label: 'think' },
      { id: 'faces-laugh', pack: 'faces', emoji: '😂', label: 'laugh' },
      { id: 'faces-wow', pack: 'faces', emoji: '🤩', label: 'wow' },
      { id: 'faces-peace', pack: 'faces', emoji: '😇', label: 'peace' },
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
