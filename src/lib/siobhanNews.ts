// created: 2026-11-24T13:15:00-08:00 — live kid-safe local/science/kindness news for Siobhan Daily
// updated: 2026-11-24T13:20:00-08:00 — drop kindness; add music
// updated: 2026-11-24T14:22:00-08:00 — live cards use match chips instead of static why-it-fits copy
// updated: 2026-11-24T14:38:00-08:00 — never show Google query as source; nicer publisher label
// updated: 2026-11-24T14:40:00-08:00 — top 10 only; local weather/incidents → animals/env → nature/science
// updated: 2026-11-24T22:10:00-08:00 — balance bands; hard-cap NASA/space so feed isn’t all space
// updated: 2026-11-24T22:20:00-08:00 — feed2json fallback + publisher RSS + Open-Meteo weather (rss2json 503 on Google)
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

type RawRssItem = {
  // created: 2026-11-24T22:20:00-08:00
  title: string
  link: string
  description: string
  pubDate: string | null
  author: string
  feedTitle: string
}

/** created: 2026-11-24T14:40:00-08:00 — hard cap for the Siobhan feed */
const FEED_LIMIT = 10

/** created: 2026-11-24T22:10:00-08:00 — space/NASA max in the 10 (was crowding out animals/local) */
const SPACE_MAX = 2

/** created: 2026-11-24T22:10:00-08:00 — target mix: weather/local · animals/env · science */
const BAND_QUOTAS = [3, 4, 3] as const

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
  // updated: 2026-11-24T22:20:00-08:00 — band + take for NASA
  id: string
  tag: string
  emoji: string
  place: string
  band: 0 | 1 | 2
  rssUrl: string
  take?: number
}

/** created: 2026-11-24T13:15:00-08:00 */
function googleNewsRss(query: string): string {
  const q = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`
}

/**
 * created: 2026-11-24T14:40:00-08:00
 * updated: 2026-11-24T22:20:00-08:00 — mix Google (via fallback) + stable publisher RSS
 * Themes: weather/local → animals/env → science/space
 */
const FEEDS: FeedSpec[] = [
  {
    id: 'local-weather',
    tag: 'Weather',
    emoji: '🌦️',
    place: 'SoCal · weather',
    band: 0,
    rssUrl: googleNewsRss(
      'Los Angeles OR "Thousand Oaks" OR Ventura (weather OR forecast OR storm OR rain OR wind OR heat) when:3d',
    ),
  },
  {
    id: 'local-incident',
    tag: 'Local',
    emoji: '📢',
    place: 'Local · alerts',
    band: 0,
    rssUrl: googleNewsRss(
      '("road closure" OR outage OR "power outage" OR "school closure" OR advisory OR alert) ("Oak Park" OR "Thousand Oaks" OR Ventura OR "Los Angeles") when:5d',
    ),
  },
  {
    id: 'env-animals',
    tag: 'Animals',
    emoji: '🐾',
    place: 'Wildlife · animals',
    band: 1,
    // ScienceDaily is reliable on rss2json (Google News often 503)
    rssUrl: 'https://www.sciencedaily.com/rss/plants_animals.xml',
    take: 8,
  },
  {
    id: 'env-california',
    tag: 'Animals',
    emoji: '🦭',
    place: 'Wildlife · California',
    band: 1,
    rssUrl: googleNewsRss(
      '(wildlife OR whale OR dolphin OR coyote OR bird OR rescue OR zoo) (California OR "Los Angeles" OR Ventura OR SoCal) when:10d',
    ),
  },
  {
    id: 'environment',
    tag: 'Environment',
    emoji: '🌍',
    place: 'Environment',
    band: 1,
    rssUrl: 'https://www.theguardian.com/environment/rss',
    take: 8,
  },
  {
    id: 'nature-science',
    tag: 'Science',
    emoji: '🔬',
    place: 'Nature · science',
    band: 2,
    rssUrl: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    take: 8,
  },
  {
    id: 'stem-kids',
    tag: 'Science',
    emoji: '🧪',
    place: 'STEM · school',
    band: 2,
    rssUrl: googleNewsRss(
      '(STEM OR science OR museum OR dinosaur OR robot OR coding) (kids OR students OR classroom OR school) (California OR students) -NASA -astronaut when:10d',
    ),
  },
  {
    id: 'nasa',
    tag: 'Space',
    emoji: '🌙',
    place: 'NASA education',
    band: 2,
    rssUrl: 'https://www.nasa.gov/rss/dyn/educationnews.rss',
    take: 3,
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
function nicePublisher(author: string, title: string, feedTitle: string, fallback: string): string {
  if (author && !looksLikeSearchQuery(author)) return author.slice(0, 48)
  const dash = title.match(/\s[-–—]\s([^–—-]{2,48})$/)
  if (dash?.[1] && !looksLikeSearchQuery(dash[1])) return dash[1].trim()
  if (feedTitle && !looksLikeSearchQuery(feedTitle)) return feedTitle.slice(0, 48)
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

/** created: 2026-11-24T22:10:00-08:00 — NASA / space / astronaut stories */
function isSpaceHeavy(item: LiveNewsItem): boolean {
  if (item.tag === 'Space' || item.id.startsWith('nasa-')) return true
  const t = `${item.title} ${item.blurb} ${item.source}`.toLowerCase()
  return (
    t.includes('nasa') ||
    t.includes('astronaut') ||
    t.includes('lunar') ||
    /\bspace\b/.test(t) ||
    t.includes('rocket') ||
    t.includes('orbit')
  )
}

/**
 * created: 2026-11-24T22:20:00-08:00
 * rss2json often 503s on Google News; feed2json.org still returns those feeds.
 */
async function fetchRawRssItems(rssUrl: string): Promise<RawRssItem[]> {
  // 1) rss2json
  try {
    const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
    const res = await fetch(endpoint)
    if (res.ok) {
      const data = (await res.json()) as {
        status?: string
        feed?: { title?: string }
        items?: Array<{
          title?: string
          link?: string
          description?: string
          pubDate?: string
          author?: string
        }>
      }
      if (data.status === 'ok' && Array.isArray(data.items) && data.items.length) {
        const feedTitle = stripHtml(data.feed?.title || '')
        return data.items.map((item) => ({
          title: stripHtml(item.title || ''),
          link: (item.link || '').trim(),
          description: stripHtml(item.description || ''),
          pubDate: item.pubDate || null,
          author: stripHtml(item.author || ''),
          feedTitle,
        }))
      }
    }
  } catch {
    // fall through
  }

  // 2) feed2json.org
  const endpoint2 = `https://feed2json.org/convert?url=${encodeURIComponent(rssUrl)}`
  const res2 = await fetch(endpoint2)
  if (!res2.ok) throw new Error(`feed2json HTTP ${res2.status}`)
  const data2 = (await res2.json()) as {
    err?: string
    title?: string
    items?: Array<{
      title?: string
      url?: string
      external_url?: string
      content_text?: string
      content_html?: string
      summary?: string
      date_published?: string
      author?: { name?: string }
    }>
  }
  if (data2.err || !Array.isArray(data2.items)) throw new Error(data2.err || 'feed2json empty')
  const feedTitle = stripHtml(data2.title || '')
  return data2.items.map((item) => ({
    title: stripHtml(item.title || ''),
    link: (item.url || item.external_url || '').trim(),
    description: stripHtml(item.content_text || item.summary || item.content_html || ''),
    pubDate: item.date_published || null,
    author: stripHtml(item.author?.name || ''),
    feedTitle,
  }))
}

/** created: 2026-11-24T13:15:00-08:00 */
/** updated: 2026-11-24T22:20:00-08:00 — dual proxy + publisher feeds */
async function fetchRss(spec: FeedSpec): Promise<LiveNewsItem[]> {
  const raw = await fetchRawRssItems(spec.rssUrl)
  const take = spec.take ?? (spec.id === 'nasa' ? 3 : 10)
  const out: LiveNewsItem[] = []
  for (const item of raw.slice(0, take)) {
    const title = item.title
    const rawDesc = item.description
    const blurb = niceBlurb(title, rawDesc)
    const hay = `${title} ${rawDesc}`
    if (!title || isBlocked(hay)) continue
    const link = item.link
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
      publishedAt: item.pubDate,
      source: nicePublisher(item.author, title, item.feedTitle, spec.tag),
      live: true,
      priorityBand: band,
    })
  }
  return out
}

/** created: 2026-11-24T22:20:00-08:00 — WMO weather codes → kid-friendly label */
function weatherLabel(code: number): { emoji: string; label: string } {
  if (code === 0) return { emoji: '☀️', label: 'Clear skies' }
  if (code <= 3) return { emoji: '🌤️', label: 'Partly cloudy' }
  if (code <= 48) return { emoji: '🌫️', label: 'Foggy' }
  if (code <= 57) return { emoji: '🌦️', label: 'Drizzle' }
  if (code <= 67) return { emoji: '🌧️', label: 'Rain' }
  if (code <= 77) return { emoji: '🌨️', label: 'Snow / ice' }
  if (code <= 82) return { emoji: '🌧️', label: 'Showers' }
  if (code <= 99) return { emoji: '⛈️', label: 'Thunderstorms' }
  return { emoji: '🌦️', label: 'Local weather' }
}

/**
 * created: 2026-11-24T22:20:00-08:00
 * Guaranteed Oak Park–area weather card (Open-Meteo) so band 0 is never empty.
 */
async function fetchOakParkWeatherCard(): Promise<LiveNewsItem | null> {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=34.1792&longitude=-118.762&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FLos_Angeles'
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as {
      current?: {
        time?: string
        temperature_2m?: number
        weather_code?: number
        wind_speed_10m?: number
      }
    }
    const cur = data.current
    if (!cur || typeof cur.temperature_2m !== 'number') return null
    const { emoji, label } = weatherLabel(Number(cur.weather_code || 0))
    const temp = Math.round(cur.temperature_2m)
    const wind = Math.round(Number(cur.wind_speed_10m || 0))
    const title = `Oak Park area: ${temp}°F · ${label}`
    const blurb = `Right now near Oak Park / Conejo Valley — ${temp}°F, ${label.toLowerCase()}, wind about ${wind} mph.`
    return {
      id: `oakpark-weather-${cur.time || 'now'}`,
      tag: 'Weather',
      emoji,
      title,
      blurb,
      place: 'Oak Park · live',
      funFact: '',
      fitChips: ['Weather', 'Oak Park', 'Live'],
      url: 'https://forecast.weather.gov/MapClick.php?lat=34.1792&lon=-118.762',
      publishedAt: cur.time ? new Date(cur.time).toISOString() : new Date().toISOString(),
      source: 'Open-Meteo',
      live: true,
      priorityBand: 0,
    }
  } catch {
    return null
  }
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
 * updated: 2026-11-24T22:20:00-08:00 — Open-Meteo weather + dual RSS proxy + 3/4/3 + SPACE_MAX
 */
export async function loadSiobhanLiveNews(): Promise<{
  items: LiveNewsItem[]
  fromLive: boolean
  fetchedAt: string
  errors: string[]
}> {
  const errors: string[] = []
  const [weatherCard, ...batches] = await Promise.all([
    fetchOakParkWeatherCard(),
    ...FEEDS.map(async (spec) => {
      try {
        return await fetchRss(spec)
      } catch {
        errors.push(spec.id)
        return [] as LiveNewsItem[]
      }
    }),
  ])

  const seen = new Set<string>()
  const merged: LiveNewsItem[] = []
  if (weatherCard) merged.push(weatherCard)
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
    const sa = rankScore(`${a.title} ${a.blurb}`, ba) - (isSpaceHeavy(a) ? 20 : 0)
    const sb = rankScore(`${b.title} ${b.blurb}`, bb) - (isSpaceHeavy(b) ? 20 : 0)
    if (sb !== sa) return sb - sa
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0
    return tb - ta
  })

  const picked: LiveNewsItem[] = []
  const used = new Set<string>()
  let spaceCount = 0

  const tryPick = (item: LiveNewsItem): boolean => {
    if (picked.length >= FEED_LIMIT || used.has(item.id)) return false
    if (isSpaceHeavy(item) && spaceCount >= SPACE_MAX) return false
    used.add(item.id)
    picked.push(item)
    if (isSpaceHeavy(item)) spaceCount += 1
    return true
  }

  // Always keep the live Oak Park weather card first when present
  if (weatherCard) tryPick(weatherCard)

  for (let band = 0; band <= 2; band++) {
    const want = BAND_QUOTAS[band]
    let got = picked.filter((p) => (p.priorityBand ?? 2) === band).length
    for (const item of merged) {
      if (got >= want || picked.length >= FEED_LIMIT) break
      if ((item.priorityBand ?? 2) !== band) continue
      if (tryPick(item)) got += 1
    }
  }

  for (const preferNonSpace of [true, false]) {
    for (const item of merged) {
      if (picked.length >= FEED_LIMIT) break
      if (preferNonSpace && isSpaceHeavy(item)) continue
      tryPick(item)
    }
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
