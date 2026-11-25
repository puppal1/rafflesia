// created: 2026-11-24T21:55:00-08:00 — engaged Siobhan story history (DB-backed)
import { supabase } from './supabase'
import type { LiveNewsItem } from './siobhanNews'

export const HISTORY_PAGE_SIZE = 10
export const HISTORY_STACK_MAX = 50

export type NewsHistoryRow = {
  // created: 2026-11-24T21:55:00-08:00
  article_key: string
  title: string
  blurb: string
  tag: string
  emoji: string
  place: string
  source: string
  url: string
  fit_chips: string[]
  published_at: string | null
  first_engaged_at: string
  last_engaged_at: string
  comment_count: number
  reaction_count: number
  engagement_score: number
}

/** created: 2026-11-24T22:08:00-08:00 — same-tab RT ping after like/comment */
export const HISTORY_TOUCHED_EVENT = 'siobhan-history-touched'

/** created: 2026-11-24T22:08:00-08:00 */
export function notifyHistoryTouched(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(HISTORY_TOUCHED_EVENT))
}

/** created: 2026-11-24T21:55:00-08:00 — save card snapshot after like/comment */
/** updated: 2026-11-24T22:08:00-08:00 — fit_chips as jsonb-safe JSON; always notify RT */
export async function touchNewsStoryHistory(item: LiveNewsItem): Promise<void> {
  const articleKey = item.id.slice(0, 500)
  const title = (item.title || '').trim()
  if (!articleKey || !title) {
    throw new Error('Missing story snapshot for history.')
  }
  const chips = Array.isArray(item.fitChips) ? item.fitChips.map(String) : []
  // updated: 2026-11-24T22:08:00-08:00 — SQL expects text JSON (avoids jsonb PostgREST fails)
  const fitChipsText = JSON.stringify(chips)
  const published =
    item.publishedAt && !Number.isNaN(Date.parse(item.publishedAt)) ? item.publishedAt : null

  const { error } = await supabase.rpc('touch_news_story_history', {
    p_article_key: articleKey,
    p_title: title,
    p_blurb: item.blurb || '',
    p_tag: item.tag || '',
    p_emoji: item.emoji || '📰',
    p_place: item.place || '',
    p_source: item.source || '',
    p_url: item.url || '',
    p_fit_chips: fitChipsText,
    p_published_at: published,
  })
  if (error) {
    if (/touch_news_story_history|news_story_history|schema cache|Could not find the function/i.test(error.message)) {
      throw new Error('Re-run docs/sql-news-story-history.sql in Supabase, then hard refresh.')
    }
    throw new Error(error.message)
  }
  notifyHistoryTouched()
}

/** created: 2026-11-24T22:05:00-08:00 — pull existing likes/comments into history table */
/** updated: 2026-11-24T22:12:00-08:00 — missing RPC returns 0 (caller still lists) */
export async function backfillNewsStoryHistory(): Promise<number> {
  const { data, error } = await supabase.rpc('backfill_news_story_history')
  if (error) {
    if (/backfill_news_story_history|schema cache|Could not find the function/i.test(error.message)) {
      return 0
    }
    throw new Error(error.message)
  }
  return Number(data || 0)
}

/**
 * created: 2026-11-24T22:05:00-08:00
 * Live cards that already have likes/comments get full title snapshots into history.
 */
export async function syncEngagedLiveStories(items: LiveNewsItem[]): Promise<void> {
  if (!items.length) return
  const keys = items.map((a) => a.id.slice(0, 500))
  const engaged = new Set<string>()

  const chunkSize = 12
  for (let i = 0; i < keys.length; i += chunkSize) {
    const chunk = keys.slice(i, i + chunkSize)
    const [com, reac] = await Promise.all([
      supabase.from('news_comments').select('article_key').in('article_key', chunk).is('deleted_at', null),
      supabase.from('news_reactions').select('article_key').in('article_key', chunk),
    ])
    for (const row of com.data || []) engaged.add(String((row as { article_key: string }).article_key))
    for (const row of reac.data || []) engaged.add(String((row as { article_key: string }).article_key))
  }

  for (const item of items) {
    const key = item.id.slice(0, 500)
    if (!engaged.has(key)) continue
    try {
      await touchNewsStoryHistory(item)
    } catch {
      // ignore per-card; modal will surface SQL errors on open
    }
  }
}

/** created: 2026-11-24T21:55:00-08:00 */
export async function listNewsStoryHistory(
  offset = 0,
  limit = HISTORY_PAGE_SIZE,
): Promise<NewsHistoryRow[]> {
  const { data, error } = await supabase.rpc('list_news_story_history', {
    p_limit: limit,
    p_offset: offset,
  })
  if (error) {
    if (/list_news_story_history|news_story_history|schema cache/i.test(error.message)) {
      throw new Error('Run docs/sql-news-story-history.sql in Supabase, then hard refresh.')
    }
    throw new Error(error.message)
  }
  return ((data || []) as Array<Record<string, unknown>>).map((row) => {
    const chips = row.fit_chips
    return {
      article_key: String(row.article_key || ''),
      title: String(row.title || ''),
      blurb: String(row.blurb || ''),
      tag: String(row.tag || ''),
      emoji: String(row.emoji || '📰'),
      place: String(row.place || ''),
      source: String(row.source || ''),
      url: String(row.url || ''),
      fit_chips: Array.isArray(chips) ? chips.map(String) : [],
      published_at: row.published_at ? String(row.published_at) : null,
      first_engaged_at: String(row.first_engaged_at || ''),
      last_engaged_at: String(row.last_engaged_at || ''),
      comment_count: Number(row.comment_count || 0),
      reaction_count: Number(row.reaction_count || 0),
      engagement_score: Number(row.engagement_score || 0),
    }
  })
}

/** created: 2026-11-24T21:55:00-08:00 */
export async function countNewsStoryHistory(): Promise<number> {
  const { data, error } = await supabase.rpc('count_news_story_history')
  if (error) return 0
  return Number(data || 0)
}

/** created: 2026-11-24T21:55:00-08:00 — history row → LiveNewsItem for dock/reactions */
export function historyRowToLiveItem(row: NewsHistoryRow): LiveNewsItem {
  return {
    id: row.article_key,
    tag: row.tag,
    emoji: row.emoji,
    title: row.title,
    blurb: row.blurb,
    place: row.place,
    funFact: '',
    fitChips: row.fit_chips,
    url: row.url,
    publishedAt: row.published_at,
    source: row.source,
    live: true,
  }
}
