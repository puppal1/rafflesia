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

/** created: 2026-11-24T21:55:00-08:00 — save card snapshot after like/comment */
export async function touchNewsStoryHistory(item: LiveNewsItem): Promise<void> {
  const articleKey = item.id.slice(0, 500)
  const { error } = await supabase.rpc('touch_news_story_history', {
    p_article_key: articleKey,
    p_title: item.title,
    p_blurb: item.blurb || '',
    p_tag: item.tag || '',
    p_emoji: item.emoji || '📰',
    p_place: item.place || '',
    p_source: item.source || '',
    p_url: item.url || '',
    p_fit_chips: item.fitChips || [],
    p_published_at: item.publishedAt,
  })
  if (error) {
    if (/touch_news_story_history|news_story_history|schema cache/i.test(error.message)) {
      throw new Error('Run docs/sql-news-story-history.sql in Supabase, then hard refresh.')
    }
    throw new Error(error.message)
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
