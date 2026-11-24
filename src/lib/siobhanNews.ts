// created: 2026-11-24T13:15:00-08:00 — live kid-safe local/science/kindness news for Siobhan Daily
import { SIOBHAN_FEED, type SiobhanArticle } from './siobhanFeed'

export type LiveNewsItem = {
  // created: 2026-11-24T13:15:00-08:00
  id: string
  tag: string
  emoji: string
  title: string
  blurb: string
  place: string
  funFact: string
  url: string
  publishedAt: string | null
  source: string
  live: boolean
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

/** created: 2026-11-24T13:15:00-08:00 — prefer these themes */
const BOOST = [
  'science',
  'stem',
  'space',
  'nasa',
  'student',
  'students',
  'school',
  'classroom',
  'teacher',
  'kindness',
  'kind',
  'community',
  'volunteer',
  'wildlife',
  'animal',
  'nature',
  'garden',
  'planet',
  'astronomy',
  'ocean',
  'climate',
  'discovery',
  'invention',
  'robot',
  'coding',
  'library',
  'museum',
  'park',
  'kids',
  'children',
  'youth',
  'education',
  'oak park',
  'ventura',
  'san fernando',
  'los angeles',
  'la county',
  'california',
]

type FeedSpec = {
  // created: 2026-11-24T13:15:00-08:00
  id: string
  tag: string
  emoji: string
  place: string
  /** Google News search query or direct RSS URL */
  rssUrl: string
}

/** created: 2026-11-24T13:15:00-08:00 */
function googleNewsRss(query: string): string {
  const q = encodeURIComponent(query)
  return `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`
}

/** created: 2026-11-24T13:15:00-08:00 — curated local + science + kindness sources */
const FEEDS: FeedSpec[] = [
  {
    id: 'oakpark',
    tag: 'Oak Park',
    emoji: '🌳',
    place: 'Oak Park · local',
    rssUrl: googleNewsRss(
      '"Oak Park" (California OR CA OR OPUSD) (school OR student OR science OR STEM OR library OR park) when:7d',
    ),
  },
  {
    id: 'la-science',
    tag: 'L.A. Science',
    emoji: '🔬',
    place: 'Los Angeles · science',
    rssUrl: googleNewsRss(
      '("Los Angeles" OR LA) (science OR STEM OR NASA OR museum OR planetarium OR aquarium) (student OR kids OR school OR education) when:7d',
    ),
  },
  {
    id: 'sfv',
    tag: 'SF Valley',
    emoji: '☀️',
    place: 'San Fernando Valley',
    rssUrl: googleNewsRss(
      '("San Fernando Valley" OR "San Fernando" Valley) (school OR student OR science OR STEM OR library OR park) when:7d',
    ),
  },
  {
    id: 'ventura',
    tag: 'Ventura',
    emoji: '🌊',
    place: 'Ventura County',
    rssUrl: googleNewsRss(
      '("Ventura" OR "Ventura County") (school OR student OR science OR STEM OR ocean OR wildlife OR education) when:7d',
    ),
  },
  {
    id: 'kindness',
    tag: 'Kindness',
    emoji: '💛',
    place: 'Good news · kindness',
    rssUrl: googleNewsRss(
      '(kindness OR "good deed" OR volunteer OR "helping others" OR "community service") (kids OR children OR students OR school) (California OR "Los Angeles" OR Ventura OR "San Fernando") when:14d',
    ),
  },
  {
    id: 'kids-science',
    tag: 'Science',
    emoji: '🚀',
    place: 'Kid science · discovery',
    rssUrl: googleNewsRss(
      '(NASA OR space OR wildlife OR "science fair" OR STEM OR dinosaurs OR ocean) (kids OR children OR students OR classroom) when:7d',
    ),
  },
  {
    id: 'gnn',
    tag: 'Kindness',
    emoji: '✨',
    place: 'Good News Network',
    rssUrl: 'https://www.goodnewsnetwork.org/feed/',
  },
  {
    id: 'nasa',
    tag: 'Space',
    emoji: '🌙',
    place: 'NASA education',
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

/** created: 2026-11-24T13:15:00-08:00 */
function boostScore(text: string): number {
  const t = text.toLowerCase()
  let score = 0
  for (const w of BOOST) {
    if (t.includes(w)) score += 1
  }
  return score
}

/** created: 2026-11-24T13:15:00-08:00 */
function funFactFor(tag: string): string {
  if (tag === 'Kindness') return 'Small kind acts can travel farther than you think — share one today.'
  if (tag === 'Space' || tag === 'Science') return 'Scientists learn by asking questions — you can too.'
  if (tag === 'Oak Park') return 'Your town is part of a bigger science story every day.'
  return 'Stay curious · stay kind · keep scrolling for more discoveries.'
}

/** created: 2026-11-24T13:15:00-08:00 — rss2json free endpoint (browser-safe) */
async function fetchRss(spec: FeedSpec): Promise<LiveNewsItem[]> {
  const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(spec.rssUrl)}`
  const res = await fetch(endpoint)
  if (!res.ok) throw new Error(`RSS ${spec.id} HTTP ${res.status}`)
  const data = (await res.json()) as Rss2JsonResponse
  if (data.status !== 'ok' || !Array.isArray(data.items)) return []

  const out: LiveNewsItem[] = []
  for (const item of data.items.slice(0, 8)) {
    const title = stripHtml(item.title || '')
    const rawDesc = stripHtml(item.description || '')
    const blurb = rawDesc.slice(0, 220) || 'Tap Open to read the full story on the publisher site.'
    const hay = `${title} ${blurb}`
    if (!title || isBlocked(hay)) continue
    // Kindness/GNN: allow more; local feeds need a boost hit or stay
    const score = boostScore(hay)
    if (spec.id !== 'gnn' && spec.id !== 'nasa' && score < 1 && !hay.toLowerCase().includes('school')) {
      continue
    }
    const link = (item.link || '').trim()
    if (!link.startsWith('http')) continue
    out.push({
      id: `${spec.id}-${link}`,
      tag: spec.tag,
      emoji: spec.emoji,
      title,
      blurb,
      place: spec.place,
      funFact: funFactFor(spec.tag),
      url: link,
      publishedAt: item.pubDate || null,
      source: data.feed?.title || spec.tag,
      live: true,
    })
  }
  return out
}

/** created: 2026-11-24T13:15:00-08:00 */
function staticAsLive(): LiveNewsItem[] {
  return SIOBHAN_FEED.map((a: SiobhanArticle) => ({
    ...a,
    url: '',
    publishedAt: null,
    source: 'Siobhan club notes',
    live: false,
  }))
}

/** created: 2026-11-24T13:15:00-08:00 */
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
      } catch (e) {
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
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0
    if (tb !== ta) return tb - ta
    return boostScore(`${b.title} ${b.blurb}`) - boostScore(`${a.title} ${a.blurb}`)
  })

  const top = merged.slice(0, 24)
  if (top.length === 0) {
    return {
      items: staticAsLive(),
      fromLive: false,
      fetchedAt: new Date().toISOString(),
      errors,
    }
  }
  return {
    items: top,
    fromLive: true,
    fetchedAt: new Date().toISOString(),
    errors,
  }
}
