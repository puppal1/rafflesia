// created: 2026-11-24T13:15:00-08:00 — live kid-safe local/science/kindness news for Siobhan Daily
// updated: 2026-11-24T13:20:00-08:00 — drop kindness; add music
// updated: 2026-11-24T14:22:00-08:00 — live cards use match chips instead of static why-it-fits copy
// updated: 2026-11-24T14:38:00-08:00 — never show Google query as source; nicer publisher label
// updated: 2026-11-24T14:40:00-08:00 — top 10 only; local weather/incidents → animals/env → nature/science
import { SIOBHAN_FEED, type SiobhanArticle } from './siobhanFeed'

export type LiveNewsItem = {
  // created: 2026-11-24T13:15:00-08:00
  // updated: 2026-11-24T14:22:00-08:00 — fitChips for live “why here”
  // updated: 2026-11-24T14:40:00-08:00 — priorityBand for ranking
  id: string
  tag: string
  emoji: string
  title: string
  blurb: string
  place: string
  funFact: string
  fitChips: string[]
  url: string
  publishedAt: string | null
  source: string
  live: boolean
  priorityBand?: number
}

type Rss2JsonItem = {
  title?: string
  link?: string
  description?: string
  pubDate?: string
  author?: string
}

type Rss2JsonResponse = {
  status?: string
  feed?: { title?: string }
  items?: Rss2JsonItem[]
}

/** created: 2026-11-24T14:40:00-08:00 — hard cap for the Siobhan feed */
const FEED_LIMIT = 10

/** created: 2026-11-24T13:15:00-08:00 — block adult / violent / heavy crime topics */
const BLOCK = [
  'murder',
  'killed',
  'killing',
  'shooting',
  'shot dead',
  'gunman',
  'assault',
  'sexual',
  'rape',
  'abuse',
  'suicide',
  'overdose',
  'opioid',
  'homicide',
  'terror',
  'bombing',
  'explosion kills',
  'war crime',
  'massacre',
  'nude',
  'porn',
  'casino',
  'gambling',
  'lawsuit',
  'indicted',
  'arrested for',
  'stabbing',
  'domestic violence',
]

/** created: 2026-11-24T14:40:00-08:00 — local geography */
const LOCAL = [
  'oak park',
  'opusd',
  'agoura',
  'thousand oaks',
  'westlake',
  'calabasas',
  'ventura',
  'camarillo',
  'oxnard',
  'simi valley',
  'san fernando',
  'sf valley',
  'los angeles',
  'la county',
  'southern california',
  'socal',
]

/** created: 2026-11-24T14:40:00-08:00 — band 0: weather + kid-safe local incidents */
const WEATHER_INCIDENT = [
  'weather',
  'storm',
  'rain',
  'wind',
  'heat',
  'heatwave',
  'flood',
  'flooding',
  'mudslide',
  'wildfire',
  'fire weather',
  'red flag',
  'air quality',
  'smoke',
  'outage',
  'power outage',
  'road closure',
  'school closure',
  'school closed',
  'evacuation warning',
  'advisory',
  'alert',
  'traffic',
  'accident',
  'incident',
]

/** created: 2026-11-24T14:40:00-08:00 — band 1: environment / animals */
const ENV_ANIMALS = [
  'wildlife',
  'animal',
  'animals',
  'bird',
  'birds',
  'whale',
  'dolphin',
  'habitat',
  'conservation',
  'endangered',
  'rescue',
  'shelter',
  'zoo',
  'aquarium',
  'ocean',
  'beach',
  'pollution',
  'recycle',
  'recycling',
  'environment',
  'climate',
  'park',
  'parks',
  'forest',
  'tree',
  'trees',
]

/** created: 2026-11-24T14:40:00-08:00 — band 2: nature / science */
const NATURE_SCIENCE = [
  'science',
  'stem',
  'nasa',
  'space',
  'astronomy',
  'planet',
  'nature',
  'discovery',
  'museum',
  'planetarium',
  'lab',
  'experiment',
  'robot',
  'coding',
  'dinosaur',
  'fossils',
  'geology',
  'biology',
]

/** created: 2026-11-24T14:22:00-08:00 — chip labels (kept for UI) */
const CHIP_LABEL: Record<string, string> = {
  weather: 'Weather',
  storm: 'Storm',
  rain: 'Rain',
  heat: 'Heat',
  flood: 'Flood',
  wildfire: 'Fire weather',
  'air quality': 'Air quality',
  outage: 'Outage',
  'road closure': 'Road closure',
  'school closure': 'School',
  wildlife: 'Wildlife',
  animal: 'Animals',
  animals: 'Animals',
  ocean: 'Ocean',
  conservation: 'Conservation',
  environment: 'Environment',
  climate: 'Climate',
  park: 'Parks',
  science: 'Science',
  stem: 'STEM',
  space: 'Space',
  nasa: 'NASA',
  nature: 'Nature',
  discovery: 'Discovery',
  museum: 'Museum',
  'oak park': 'Oak Park',
  ventura: 'Ventura',
  'san fernando': 'SF Valley',
  'los angeles': 'L.A.',
}

type FeedSpec = {
  // created: 2026-11-24T13:15:00-08:00
  // updated: 2026-11-24T14:40:00-08:00 — band drives pick order
  id: string
  tag: string
  emoji: string
  place: string
  band: 0 | 1 | 2
  rssUrl: string
}

/** created: 2026-11-24T13:15:00-08:00 */
function googleNewsRss(query: string): string {
  const q = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`
}

/**
 * created: 2026-11-24T14:40:00-08:00
 * Priority feeds: local weather/incidents → env/animals → nature/science
 */
const FEEDS: FeedSpec[] = [
  {
    id: 'local-weather',
    tag: 'Weather',
    emoji: '🌦️',
    place: 'SoCal · weather',
    band: 0,
    rssUrl: googleNewsRss(
      '(weather OR storm OR rain OR wind OR heat OR flood OR "air quality" OR "red flag" OR wildfire) ("Oak Park" OR "Thousand Oaks" OR Ventura OR "San Fernando" OR "Los Angeles" OR SoCal OR "Southern California") when:5d',
    ),
  },
  {
    id: 'local-incident',
    tag: 'Local',
    emoji: '📢',
    place: 'Local · alerts',
    band: 0,
    rssUrl: googleNewsRss(
      '("road closure" OR outage OR "power outage" OR "school closure" OR "school closed" OR advisory OR alert OR traffic) ("Oak Park" OR OPUSD OR "Thousand Oaks" OR Ventura OR "San Fernando Valley" OR "Los Angeles") when:5d',
    ),
  },
  {
    id: 'oakpark',
    tag: 'Oak Park',
    emoji: '🌳',
    place: 'Oak Park',
    band: 0,
    rssUrl: googleNewsRss(
      '"Oak Park" (California OR CA OR OPUSD) (weather OR school OR park OR community OR student) when:7d',
    ),
  },
  {
    id: 'env-animals',
    tag: 'Animals',
    emoji: '🐾',
    place: 'Wildlife · SoCal',
    band: 1,
    rssUrl: googleNewsRss(
      '(wildlife OR animal OR whale OR dolphin OR bird OR habitat OR rescue OR zoo OR aquarium OR conservation) ("Los Angeles" OR Ventura OR California OR SoCal OR ocean OR beach) when:10d',
    ),
  },
  {
    id: 'environment',
    tag: 'Environment',
    emoji: '🌍',
    place: 'Environment',
    band: 1,
    rssUrl: googleNewsRss(
      '(environment OR climate OR pollution OR recycling OR "air quality" OR park OR forest OR ocean) (kids OR students OR school OR California OR "Los Angeles" OR Ventura) when:10d',
    ),
  },
  {
    id: 'nature-science',
    tag: 'Science',
    emoji: '🔬',
    place: 'Nature · science',
    band: 2,
    rssUrl: googleNewsRss(
      '(science OR STEM OR nature OR discovery OR museum OR planetarium OR NASA OR space) (kids OR students OR school OR classroom OR California) when:10d',
    ),
  },
  {
    id: 'nasa',
    tag: 'Space',
    emoji: '🌙',
    place: 'NASA education',
    band: 2,
    rssUrl: 'https://www.nasa.gov/rss/dyn/educationnews.rss',
  },
]

/** created: 2026-11-24T13:15:00-08:00 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

/** created: 2026-11-24T13:15:00-08:00 */
function isBlocked(text: string): boolean {
  const t = text.toLowerCase()
  return BLOCK.some((w) => t.includes(w))
}

/** created: 2026-11-24T14:40:00-08:00 — 0 weather/incident, 1 env/animals, 2 nature/science */
function classifyBand(text: string, feedBand: 0 | 1 | 2): number {
  const t = text.toLowerCase()
  const localHit = LOCAL.some((w) => t.includes(w))
  const weatherHit = WEATHER_INCIDENT.some((w) => t.includes(w))
  const envHit = ENV_ANIMALS.some((w) => t.includes(w))
  const sciHit = NATURE_SCIENCE.some((w) => t.includes(w))

  if (weatherHit && (localHit || feedBand === 0)) return 0
  if (weatherHit) return 0
  if (envHit) return 1
  if (sciHit) return 2
  return feedBand
}

/** created: 2026-11-24T14:40:00-08:00 — higher = more preferred within a band */
function rankScore(text: string, band: number): number {
  const t = text.toLowerCase()
  let score = 0
  if (LOCAL.some((w) => t.includes(w))) score += 8
  if (band === 0) {
    for (const w of WEATHER_INCIDENT) if (t.includes(w)) score += 3
  } else if (band === 1) {
    for (const w of ENV_ANIMALS) if (t.includes(w)) score += 2
  } else {
    for (const w of NATURE_SCIENCE) if (t.includes(w)) score += 2
  }
  return score
}

/** created: 2026-11-24T14:22:00-08:00 */
/** updated: 2026-11-24T14:40:00-08:00 — chips from priority vocab */
function fitChipsFor(text: string, tag: string): string[] {
  const t = text.toLowerCase()
  const chips: string[] = []
  const seen = new Set<string>()
  const add = (label: string) => {
    if (!label || seen.has(label)) return
    seen.add(label)
    chips.push(label)
  }
  add(tag)
  for (const w of [...WEATHER_INCIDENT, ...ENV_ANIMALS, ...NATURE_SCIENCE, ...LOCAL]) {
    if (!t.includes(w)) continue
    add(CHIP_LABEL[w] || w.replace(/\b\w/g, (c) => c.toUpperCase()))
    if (chips.length >= 3) break
  }
  return chips.slice(0, 3)
}

/** created: 2026-11-24T14:38:00-08:00 */
function looksLikeSearchQuery(s: string): boolean {
  const t = s.toLowerCase()
  return (
    t.includes(' or ') ||
    t.includes('when:') ||
    t.includes('google news') ||
    t.includes('"') ||
    t.length > 56
  )
}

/** created: 2026-11-24T14:38:00-08:00 */
function nicePublisher(
  item: Rss2JsonItem,
  title: string,
  feedTitle: string | undefined,
  fallback: string,
): string {
  const author = stripHtml(item.author || '')
  if (author && !looksLikeSearchQuery(author)) return author.slice(0, 48)
  const dash = title.match(/\s[-–—]\s([^–—-]{2,48})$/)
  if (dash?.[1] && !looksLikeSearchQuery(dash[1])) return dash[1].trim()
  const ft = stripHtml(feedTitle || '')
  if (ft && !looksLikeSearchQuery(ft)) return ft.slice(0, 48)
  return fallback
}

/** created: 2026-11-24T14:38:00-08:00 */
function niceBlurb(title: string, rawDesc: string): string {
  const blurb = rawDesc.slice(0, 180).trim()
  if (!blurb) return ''
  const t = title.toLowerCase().replace(/\s+/g, ' ')
  const b = blurb.toLowerCase().replace(/\s+/g, ' ')
  if (b === t || t.startsWith(b) || b.startsWith(t.slice(0, Math.min(40, t.length)))) return ''
  return blurb
}

/** created: 2026-11-24T13:15:00-08:00 */
/** updated: 2026-11-24T14:40:00-08:00 — band on each item */
async function fetchRss(spec: FeedSpec): Promise<LiveNewsItem[]> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(spec.rssUrl)}`
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`RSS ${spec.id} HTTP ${res.status}`)
  const data = (await res.json()) as Rss2JsonResponse
  if (data.status !== 'ok' || !Array.isArray(data.items)) return []

  const out: LiveNewsItem[] = []
  for (const item of data.items.slice(0, 10)) {
    const title = stripHtml(item.title || '')
    const rawDesc = stripHtml(item.description || '')
    const blurb = niceBlurb(title, rawDesc)
    const hay = `${title} ${rawDesc}`
    if (!title || isBlocked(hay)) continue
    const link = (item.link || '').trim()
    if (!link.startsWith('http')) continue
    const band = classifyBand(hay, spec.band)
    out.push({
      id: `${spec.id}-${link}`,
      tag: spec.tag,
      emoji: spec.emoji,
      title,
      blurb,
      place: spec.place,
      funFact: '',
      fitChips: fitChipsFor(hay, spec.tag),
      url: link,
      publishedAt: item.pubDate || null,
      source: nicePublisher(item, title, data.feed?.title, spec.tag),
      live: true,
      priorityBand: band,
    })
  }
  return out
}

/** created: 2026-11-24T13:15:00-08:00 */
/** updated: 2026-11-24T14:40:00-08:00 — offline fallback also capped at 10 */
function staticAsLive(): LiveNewsItem[] {
  return SIOBHAN_FEED.slice(0, FEED_LIMIT).map((a: SiobhanArticle) => ({
    ...a,
    fitChips: [a.tag, a.place].filter(Boolean).slice(0, 3),
    url: '',
    publishedAt: null,
    source: 'Siobhan club notes',
    live: false,
    priorityBand: 2,
  }))
}

/**
 * created: 2026-11-24T13:15:00-08:00
 * updated: 2026-11-24T14:40:00-08:00 — pick 10: local weather/incidents, then env/animals, then science
 */
export async function loadSiobhanLiveNews(): Promise<{
  items: LiveNewsItem[]
  fromLive: boolean
  fetchedAt: string
  errors: string[]
}> {
  const errors: string[] = []
  const batches = await Promise.all(
    FEEDS.map(async (spec) => {
      try {
        return await fetchRss(spec)
      } catch {
        errors.push(spec.id)
        return [] as LiveNewsItem[]
      }
    }),
  )

  const seen = new Set<string>()
  const merged: LiveNewsItem[] = []
  for (const batch of batches) {
    for (const item of batch) {
      const key = item.title.toLowerCase().replace(/\s+/g, ' ').slice(0, 80)
      if (seen.has(key)) continue
      seen.add(key)
      merged.push(item)
    }
  }

  merged.sort((a, b) => {
    const ba = a.priorityBand ?? 2
    const bb = b.priorityBand ?? 2
    if (ba !== bb) return ba - bb
    const sa = rankScore(`${a.title} ${a.blurb}`, ba)
    const sb = rankScore(`${b.title} ${b.blurb}`, bb)
    if (sb !== sa) return sb - sa
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return tb - ta
  })

  // Fill quota by band so weather/local aren't crowded out: aim ~4 / ~3 / ~3
  const quotas = [4, 3, 3]
  const picked: LiveNewsItem[] = []
  const used = new Set<string>()
  for (let band = 0; band <= 2; band++) {
    const want = quotas[band]
    let got = 0
    for (const item of merged) {
      if (got >= want || picked.length >= FEED_LIMIT) break
      if ((item.priorityBand ?? 2) !== band) continue
      if (used.has(item.id)) continue
      used.add(item.id)
      picked.push(item)
      got += 1
    }
  }
  // Top up to 10 from remaining ranked list
  for (const item of merged) {
    if (picked.length >= FEED_LIMIT) break
    if (used.has(item.id)) continue
    used.add(item.id)
    picked.push(item)
  }

  if (picked.length === 0) {
    return {
      items: staticAsLive(),
      fromLive: false,
      fetchedAt: new Date().toISOString(),
      errors,
    }
  }
  return {
    items: picked.slice(0, FEED_LIMIT),
    fromLive: true,
    fetchedAt: new Date().toISOString(),
    errors,
  }
}
