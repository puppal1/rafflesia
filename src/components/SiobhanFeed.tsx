// created: 2026-11-24T13:10:00-08:00 — manga-style scrolling science feed for Siobhan Daily
// updated: 2026-11-24T13:15:00-08:00 — live kid-safe local/science/kindness news
// updated: 2026-11-24T13:20:00-08:00 — music replaces kindness
// updated: 2026-11-24T13:25:00-08:00 — comments on news cards
// updated: 2026-11-24T14:15:00-08:00 — side/bottom comment dock; feed stays readable
// updated: 2026-11-24T14:20:00-08:00 — emoji likes on news cards
// updated: 2026-11-24T14:25:00-08:00 — like in action row; Comments shows count
// updated: 2026-11-24T14:38:00-08:00 — calmer cards; no Google query source
// updated: 2026-11-24T21:55:00-08:00 — Stories we talked about history modal
// updated: 2026-11-24T22:08:00-08:00 — live history count on button after engage
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  HISTORY_TOUCHED_EVENT,
  countNewsStoryHistory,
  syncEngagedLiveStories,
} from '../lib/siobhanHistory'
import {
  loadSiobhanLiveNews,
  type FeedSourceReport,
  type LiveNewsItem,
} from '../lib/siobhanNews'
import { SiobhanNewsComments } from './SiobhanNewsComments'
import { SiobhanArticleReactions } from './SiobhanArticleReactions'
import { SiobhanTalkedAboutModal } from './SiobhanTalkedAboutModal'
import type { Profile } from '../types'

const SCHOOL_URL = 'https://sites.google.com/opusd.us/siobhan/siobh%C3%A1n-daily'

/** created: 2026-11-24T14:38:00-08:00 — short relative-ish stamp */
function formatSiobhanWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 36) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 8) return `${days}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

type Props = {
  // created: 2026-11-24T13:25:00-08:00
  userId: string
  profilesById: Record<string, Profile>
  onProfiles?: (rows: Profile[]) => void
  /** created: 2026-11-24T14:05:00-08:00 */
  uploadPicture?: (file: File) => Promise<string>
}

/** created: 2026-11-24T13:10:00-08:00 */
/** updated: 2026-11-24T21:55:00-08:00 — history modal for engaged stories */
export function SiobhanFeed({ userId, profilesById, onProfiles, uploadPicture }: Props) {
  const [items, setItems] = useState<LiveNewsItem[]>([])
  const [fromLive, setFromLive] = useState(false)
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState('')
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [activeStoryOverride, setActiveStoryOverride] = useState<LiveNewsItem | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyCount, setHistoryCount] = useState(0)
  const [feedReport, setFeedReport] = useState<FeedSourceReport[]>([])

  const activeStory =
    activeStoryOverride ||
    items.find((a) => a.id.slice(0, 500) === activeKey) ||
    null

  // created: 2026-11-24T22:08:00-08:00 — badge on Stories button
  const refreshHistoryCount = useCallback(async () => {
    try {
      setHistoryCount(await countNewsStoryHistory())
    } catch {
      setHistoryCount(0)
    }
  }, [])

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
      setFeedReport(result.report)
      const keys = result.items.map((a) => a.id.slice(0, 500))
      await loadCommentCounts(keys)
      // updated: 2026-11-24T23:05:00-08:00 — never block the feed UI on history sync
      void syncEngagedLiveStories(result.items).catch(() => undefined)
      void refreshHistoryCount().catch(() => undefined)
      const failed = result.report.filter((r) => !r.ok)
      if (!result.fromLive) {
        setErr('Live news is resting — showing club science cards. Tap Refresh feed to try again.')
      } else if (failed.length >= 4) {
        // updated: 2026-11-24T22:25:00-08:00 — name failing sources (also in DevTools [siobhan-feed])
        setErr(
          `Some feeds failed: ${failed.map((f) => f.id).join(', ')}. Check DevTools console for [siobhan-feed].`,
        )
      }
    } catch {
      setErr('Could not load live news. Try Refresh feed.')
    } finally {
      setBusy(false)
    }
  }, [loadCommentCounts, refreshHistoryCount])

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [refresh])

  // created: 2026-11-24T22:08:00-08:00 — bump Stories count right after like/comment
  // updated: 2026-11-24T22:20:00-08:00 — optimistic +1 then reconcile from DB
  useEffect(() => {
    const onTouched = () => {
      setHistoryCount((n) => n + 1)
      refreshHistoryCount().catch(() => undefined)
    }
    window.addEventListener(HISTORY_TOUCHED_EVENT, onTouched)
    return () => window.removeEventListener(HISTORY_TOUCHED_EVENT, onTouched)
  }, [refreshHistoryCount])

  // created: 2026-11-24T14:25:00-08:00 — refresh count when dock closes after commenting
  useEffect(() => {
    if (activeKey) return
    if (!items.length) return
    loadCommentCounts(items.map((a) => a.id.slice(0, 500))).catch(() => undefined)
  }, [activeKey, items, loadCommentCounts])

  function openComments(item: LiveNewsItem) {
    const key = item.id.slice(0, 500)
    setActiveStoryOverride(item)
    setActiveKey(key)
    setHistoryOpen(false)
  }

  function closeComments() {
    setActiveKey(null)
    setActiveStoryOverride(null)
  }

  return (
    <div className={`siobhan-panel ${activeKey ? 'has-comment-dock' : ''}`}>
      <header className="siobhan-hero">
        <div className="siobhan-hero-badge" aria-hidden>
          📰✨
        </div>
        <div className="siobhan-hero-copy">
          <h2 className="panel-title">Siobhan Daily</h2>
          <p className="siobhan-tagline">
            Local weather & alerts · animals · nature & science
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
            <button
              className="ghost btn-compact siobhan-refresh-feed"
              type="button"
              disabled={busy}
              title="Reload these 10 news stories"
              onClick={() => refresh()}
            >
              {busy ? 'Refreshing feed…' : 'Refresh feed'}
            </button>
            {/* created: 2026-11-24T21:55:00-08:00 */}
            <button
              className="ghost btn-compact siobhan-talked-btn"
              type="button"
              onClick={() => setHistoryOpen(true)}
            >
              {historyCount > 0
                ? `Stories we talked about (${historyCount})`
                : 'Stories we talked about'}
            </button>
          </p>
        </div>
        <div className="siobhan-hero-actions">
          <a
            className="ghost btn-compact siobhan-school-btn"
            href={SCHOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            School paper ↗
          </a>
        </div>
      </header>

      <p className="siobhan-scroll-hint muted">
        10 live stories · liked/commented ones stay in Stories we talked about
      </p>
      {err ? <p className="siobhan-status muted">{err}</p> : null}
      {/* created: 2026-11-24T22:25:00-08:00 — live source health (DevTools: [siobhan-feed]) */}
      {feedReport.length > 0 ? (
        <p className="siobhan-feed-report muted" title="Feed source health">
          {feedReport.map((r) => (
            <span key={r.id} className={r.ok ? 'siobhan-src-ok' : 'siobhan-src-bad'}>
              {r.ok ? '✓' : '✗'} {r.id}
              {r.ok ? `(${r.count})` : ''}{' '}
            </span>
          ))}
        </p>
      ) : null}

      <div className="siobhan-workspace">
        <div className="siobhan-feed" role="feed" aria-label="Siobhan live science and music news">
          {items.length === 0 && busy ? (
            <p className="muted">Summoning friendly headlines…</p>
          ) : (
            items.map((a, i) => {
              const key = a.id.slice(0, 500)
              const open = activeKey === key
              const when = a.publishedAt ? formatSiobhanWhen(a.publishedAt) : ''
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
                    {a.live ? <span className="siobhan-chip live">Live</span> : null}
                    {a.source ? <span className="siobhan-outlet">{a.source}</span> : null}
                  </div>
                  <h3 className="siobhan-title">{a.title}</h3>
                  {a.blurb ? <p className="siobhan-blurb">{a.blurb}</p> : null}
                  {a.live && a.fitChips?.length ? (
                    <div className="siobhan-fit-row" aria-label="Why this story is here">
                      {a.fitChips.map((chip) => (
                        <span className="siobhan-fit-chip" key={chip}>
                          {chip}
                        </span>
                      ))}
                    </div>
                  ) : !a.live && a.funFact ? (
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
                        Open
                      </a>
                    ) : null}
                    <SiobhanArticleReactions articleKey={key} userId={userId} story={a} />
                    <button
                      className={open ? 'primary btn-compact' : 'ghost btn-compact'}
                      type="button"
                      onClick={() => {
                        if (open) closeComments()
                        else openComments(a)
                      }}
                    >
                      {`Comments (${commentCounts[key] ?? 0})${open ? ' · open' : ''}`}
                    </button>
                    {when ? <span className="muted siobhan-when">{when}</span> : null}
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
              story={activeStory}
              userId={userId}
              profilesById={profilesById}
              onProfiles={onProfiles}
              uploadPicture={uploadPicture}
              onClose={closeComments}
              onCountChange={bumpCommentCount}
            />
          </aside>
        ) : null}
      </div>

      <SiobhanTalkedAboutModal
        open={historyOpen}
        userId={userId}
        commentCounts={commentCounts}
        onClose={() => setHistoryOpen(false)}
        onOpenComments={openComments}
      />

      <footer className="siobhan-footer">
        <p className="muted">Official school paper</p>
        <a className="ghost btn-compact" href={SCHOOL_URL} target="_blank" rel="noopener noreferrer">
          Click here to go to Siobhan Daily!
        </a>
      </footer>
    </div>
  )
}
