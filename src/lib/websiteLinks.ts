// created: 2026-11-24T00:05:00-08:00 — normalize / validate profile website links
import type { WebsiteLink } from '../types'

export const WEBSITE_LINKS_MAX = 5

/** created: 2026-11-24T00:05:00-08:00 */
export function parseWebsiteLinks(raw: unknown): WebsiteLink[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null
      const title = String((row as { title?: unknown }).title || '').trim()
      const url = String((row as { url?: unknown }).url || '').trim()
      if (!title && !url) return null
      return { title: title || 'Website', url }
    })
    .filter((x): x is WebsiteLink => Boolean(x))
    .slice(0, WEBSITE_LINKS_MAX)
}

/** created: 2026-11-24T00:05:00-08:00 */
export function normalizeWebsiteUrl(input: string): string {
  const t = input.trim()
  if (!t) return ''
  if (/^https?:\/\//i.test(t)) return t
  return `https://${t}`
}

/** created: 2026-11-24T00:05:00-08:00 */
export function isSafeWebsiteUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/** created: 2026-11-24T00:05:00-08:00 */
export function cleanWebsiteLinksForSave(links: WebsiteLink[]): WebsiteLink[] {
  return links
    .map((l) => ({
      title: l.title.trim().slice(0, 40) || 'Website',
      url: normalizeWebsiteUrl(l.url),
    }))
    .filter((l) => l.url && isSafeWebsiteUrl(l.url))
    .slice(0, WEBSITE_LINKS_MAX)
}
