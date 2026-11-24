// created: 2026-11-24T13:10:00-08:00 — manga-style scrolling science feed for Siobhan Daily
// updated: 2026-11-24T13:15:00-08:00 — live kid-safe local/science/kindness news
// updated: 2026-11-24T13:20:00-08:00 — music replaces kindness
// updated: 2026-11-24T13:25:00-08:00 — comments on news cards
// updated: 2026-11-24T14:15:00-08:00 — side/bottom comment dock; feed stays readable
// updated: 2026-11-24T14:20:00-08:00 — emoji likes on news cards
// updated: 2026-11-24T14:25:00-08:00 — like in action row; Comments shows count
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadSiobhanLiveNews, type LiveNewsItem } from '../lib/siobhanNews'
import { SiobhanNewsComments } from './SiobhanNewsComments'
import { SiobhanArticleReactions } from './SiobhanArticleReactions'
import type { Profile } from '../types'

const SCHOOL_URL = 'https://sites.google.com/opusd.us/siobhan/siobh%C3%A1n-daily'

type Props = {
  // created: 2026-11-24T13:25:00-08:00
  userId: string
  profilesById: Record<string, Profile>
  onProfiles?: (rows: Profile[]) => void
  /** created: 2026-11-24T14:05:00-08:00 */
  uploadPicture?: (file: File) => Promise<string>
}

/** created: 2026-11-24T13:10:00-08:00 */
/** updated: 2026-11-24T14:15:00-08:00 — comments open in sticky dock beside the feed */
export function SiobhanFeed({ userId, profilesById, onProfiles, uploadPicture }: Props) {
  const [items, setItems] = useState<LiveNewsItem[]>([])
  const [fromLive, setFromLive] = useState(false)
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState('')
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  const activeStory = items.find((a) => a.id.slice(0, 500) === activeKey) || null

  // created: 2026-11-24T14:25:00-08:00 — batch comment counts for Comments (n)
  // updated: 2026-11-24T14:28:00-08:00 — chunk .in() (long article keys break one big query)
  const loadCommentCounts = useCallback(async (keys: string[]) => {
    if (!keys.length) {
      setCommentCounts({})
      return
    }
    const next: Record<string, number> = {}
    for (const k of keys) next[k] = 0
    const chunkSize = 12
    for (let i = 0; i < keys.length; i += chunkSize) {
      const chunk = keys.slice(i, i + chunkSize)
      const { data, error } = await supabase
        .from('news_comments')
        .select('article_key')
        .in('article_key', chunk)
        .is('deleted_at', null)
      if (error) continue
      for (const row of data || []) {
        const k = (row as { article_key: string }).article_key
        next[k] = (next[k] || 0) + 1
      }
    }
    setCommentCounts(next)
  }, [])

  // created: 2026-11-24T14:28:00-08:00 — dock updates badge after post/delete
  const bumpCommentCount = useCallback((articleKey: string, count: number) => {
    setCommentCounts((prev) => ({ ...prev, [articleKey]: count }))
  }, [])

  const refresh = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const result = await loadSiobhanLiveNews()
      setItems(result.items)
      setFromLive(result.fromLive)
      setFetchedAt(result.fetchedAt)
      const keys = result.items.map((a) => a.id.slice(0, 500))
      await loadCommentCounts(keys)
      if (!result.fromLive) {
        setErr('Live news is resting — showing club science cards. Tap Refresh to try again.')
      }
    } catch {
      setErr('Could not load live news. Try Refresh.')
    } finally {
      setBusy(false)
    }
  }, [loadCommentCounts])

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [refresh])

  // created: 2026-11-24T14:25:00-08:00 — refresh count when dock closes after commenting
  useEffect(() => {
    if (activeKey) return
    if (!items.length) return
    loadCommentCounts(items.map((a) => a.id.slice(0, 500))).catch(() => undefined)
  }, [activeKey, items, loadCommentCounts])

  return (
    <div className={`siobhan-panel ${activeKey ? 'has-comment-dock' : ''}`}>
      <header className="siobhan-hero">
        <div className="siobhan-hero-badge" aria-hidden>
          📰✨
        </div>
        <div className="siobhan-hero-copy">
          <h2 className="panel-title">Siobhan Daily</h2>
          <p className="siobhan-tagline">
            Live scroll · Oak Park · L.A. · Ventura · SF Valley · science · music
          </p>
          <p className="siobhan-live-meta">
            {busy ? (
              <span className="siobhan-live-pill warming">Loading…</span>
            ) : fromLive ? (
              <span className="siobhan-live-pill on">Live</span>
            ) : (
              <span className="siobhan-live-pill off">Offline cards</span>
            )}
            {fetchedAt && !busy ? (
              <span className="muted"> Updated {new Date(fetchedAt).toLocaleTimeString()}</span>
            ) : null}
          </p>
        </div>
        <div className="siobhan-hero-actions">
          <button className="ghost btn-compact" type="button" disabled={busy} onClick={() => refresh()}>
            {busy ? 'Refreshing…' : 'Refresh'}
          </button>
          <a
            className="primary btn-compact siobhan-school-btn"
            href={SCHOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open school site
          </a>
        </div>
      </header>

      <p className="siobhan-scroll-hint muted">
        Kid-safe filter on · open Comments to chat while you keep reading
      </p>
      {err ? <p className="siobhan-status muted">{err}</p> : null}

      <div className="siobhan-workspace">
        <div className="siobhan-feed" role="feed" aria-label="Siobhan live science and music news">
          {items.length === 0 && busy ? (
            <p className="muted">Summoning friendly headlines…</p>
          ) : (
            items.map((a, i) => {
              const key = a.id.slice(0, 500)
              const open = activeKey === key
              return (
                <article
                  key={a.id}
                  className={`siobhan-panel-card tone-${(i % 4) + 1}${open ? ' commenting' : ''}`}
                  aria-posinset={i + 1}
                  aria-setsize={items.length}
                >
                  <div className="siobhan-panel-chrome">
                    <span className="siobhan-sticker" aria-hidden>
                      {a.emoji}
                    </span>
                    <span className="siobhan-chip">{a.tag}</span>
                    <span className="siobhan-place">{a.place}</span>
                    {a.live ? <span className="siobhan-chip live">Live</span> : null}
                  </div>
                  <h3 className="siobhan-title">{a.title}</h3>
                  <p className="siobhan-blurb">{a.blurb}</p>
                  {/* updated: 2026-11-24T14:22:00-08:00 — live: match chips; offline: real fun fact */}
                  {a.live ? (
                    <div className="siobhan-fit-row" aria-label="Why this story is here">
                      <span className="siobhan-fit-label">Why here</span>
                      {(a.fitChips?.length ? a.fitChips : [a.tag]).map((chip) => (
                        <span className="siobhan-fit-chip" key={chip}>
                          {chip}
                        </span>
                      ))}
                      {a.source ? <span className="siobhan-fit-source">{a.source}</span> : null}
                    </div>
                  ) : a.funFact ? (
                    <div className="siobhan-bubble">
                      <span className="siobhan-bubble-label">Fun fact</span>
                      <p>{a.funFact}</p>
                    </div>
                  ) : null}
                  <div className="siobhan-card-actions">
                    {a.url ? (
                      <a
                        className="primary btn-compact"
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open story
                      </a>
                    ) : null}
                    {/* updated: 2026-11-24T14:25:00-08:00 — Like lives here, left of Comments */}
                    <SiobhanArticleReactions articleKey={key} userId={userId} />
                    <button
                      className={open ? 'primary btn-compact' : 'ghost btn-compact'}
                      type="button"
                      onClick={() => setActiveKey(open ? null : key)}
                    >
                      {/* updated: 2026-11-24T14:28:00-08:00 — count always visible */}
                      {`Comments (${commentCounts[key] ?? 0})${open ? ' · open' : ''}`}
                    </button>
                    {a.publishedAt ? (
                      <span className="muted siobhan-when">
                        {new Date(a.publishedAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="muted siobhan-when">{a.source}</span>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>

        {activeKey && activeStory ? (
          <aside className="siobhan-comment-rail" aria-label="Story comments">
            <SiobhanNewsComments
              articleKey={activeKey}
              storyTitle={activeStory.title}
              userId={userId}
              profilesById={profilesById}
              onProfiles={onProfiles}
              uploadPicture={uploadPicture}
              onClose={() => setActiveKey(null)}
              onCountChange={bumpCommentCount}
            />
          </aside>
        ) : null}
      </div>

      <footer className="siobhan-footer">
        <p className="muted">Official school paper</p>
        <a className="ghost btn-compact" href={SCHOOL_URL} target="_blank" rel="noopener noreferrer">
          Click here to go to Siobhan Daily!
        </a>
      </footer>
    </div>
  )
}
