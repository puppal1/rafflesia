// created: 2026-11-24T14:20:00-08:00 — emoji likes on Siobhan news cards
// updated: 2026-11-24T21:55:00-08:00 — touch engaged-story history after like
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { newsRowsAsReactions, type NewsReactionRow } from '../lib/reactions'
import { touchNewsStoryHistory } from '../lib/siobhanHistory'
import type { LiveNewsItem } from '../lib/siobhanNews'
import { ReactionBar } from './ReactionBar'

type Props = {
  // created: 2026-11-24T14:20:00-08:00
  // updated: 2026-11-24T21:55:00-08:00
  articleKey: string
  userId: string
  /** created: 2026-11-24T21:55:00-08:00 — card snapshot for history */
  story?: LiveNewsItem | null
}

/** created: 2026-11-24T14:20:00-08:00 */
/** updated: 2026-11-24T21:55:00-08:00 */
export function SiobhanArticleReactions({ articleKey, userId, story }: Props) {
  const [rows, setRows] = useState<NewsReactionRow[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('news_reactions')
      .select('article_key, user_id, emoji')
      .eq('article_key', articleKey)
    if (error) {
      setErr(
        /news_reactions|schema cache/i.test(error.message)
          ? 'Run docs/sql-news-reactions.sql in Supabase, then hard refresh.'
          : error.message,
      )
      return
    }
    setRows((data || []) as NewsReactionRow[])
    setErr('')
  }, [articleKey])

  useEffect(() => {
    load().catch(() => undefined)
  }, [load])

  async function react(_type: 'news' | 'post' | 'comment', targetId: string, emoji: string) {
    setBusy(true)
    setErr('')
    try {
      const { error } = await supabase.rpc('set_news_reaction', {
        p_article_key: targetId,
        p_emoji: emoji,
      })
      if (error) {
        throw new Error(
          /news_reactions|set_news_reaction|schema cache/i.test(error.message)
            ? 'Run docs/sql-news-reactions.sql in Supabase, then hard refresh.'
            : error.message,
        )
      }
      if (story) {
        try {
          await touchNewsStoryHistory(story)
        } catch (histErr) {
          // History is optional until SQL is run; don't block liking
          if (histErr instanceof Error && /sql-news-story-history/i.test(histErr.message)) {
            setErr(histErr.message)
          }
        }
      }
      await load()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not react.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="siobhan-article-reactions">
      <ReactionBar
        targetType="news"
        targetId={articleKey}
        userId={userId}
        rows={newsRowsAsReactions(rows)}
        busy={busy}
        emptyLabel="Like 😊"
        onReact={react}
      />
      {err ? <p className="error" style={{ margin: '4px 0 0', fontSize: '0.78rem' }}>{err}</p> : null}
    </div>
  )
}
