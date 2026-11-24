// created: 2026-11-24T13:10:00-08:00 — manga-style scrolling science feed for Siobhan Daily
// updated: 2026-11-24T13:15:00-08:00 — live kid-safe local/science/kindness news
// updated: 2026-11-24T13:20:00-08:00 — music replaces kindness
// updated: 2026-11-24T13:25:00-08:00 — comments on news cards
import { useCallback, useEffect, useState } from 'react'
import { loadSiobhanLiveNews, type LiveNewsItem } from '../lib/siobhanNews'
import { SiobhanNewsComments } from './SiobhanNewsComments'
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
/** updated: 2026-11-24T14:05:00-08:00 — pass photo upload into standard comment panel */
export function SiobhanFeed({ userId, profilesById, onProfiles, uploadPicture }: Props) {
  const [items, setItems] = useState<LiveNewsItem[]>([])
  const [fromLive, setFromLive] = useState(false)
  const [busy, setBusy] = useState(true)
  const [err, setErr] = useState('')
  const [fetchedAt, setFetchedAt] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setBusy(true)
    setErr('')
    try {
      const result = await loadSiobhanLiveNews()
      setItems(result.items)
      setFromLive(result.fromLive)
      setFetchedAt(result.fetchedAt)
      if (!result.fromLive) {
        setErr('Live news is resting — showing club science cards. Tap Refresh to try again.')
      }
    } catch {
      setErr('Could not load live news. Try Refresh.')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    refresh().catch(() => undefined)
  }, [refresh])

  return (
    <div className="siobhan-panel">
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
        Kid-safe filter on · comment on stories · tap Open for the full article
      </p>
      {err ? <p className="siobhan-status muted">{err}</p> : null}

      <div className="siobhan-feed" role="feed" aria-label="Siobhan live science and music news">
        {items.length === 0 && busy ? (
          <p className="muted">Summoning friendly headlines…</p>
        ) : (
          items.map((a, i) => (
            <article
              key={a.id}
              className={`siobhan-panel-card tone-${(i % 4) + 1}`}
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
              <div className="siobhan-bubble">
                <span className="siobhan-bubble-label">{a.live ? 'Why it fits' : 'Fun fact'}</span>
                <p>{a.funFact}</p>
              </div>
              <div className="siobhan-card-actions">
                {a.url ? (
                  <a className="primary btn-compact" href={a.url} target="_blank" rel="noopener noreferrer">
                    Open story
                  </a>
                ) : null}
                {a.publishedAt ? (
                  <span className="muted siobhan-when">{new Date(a.publishedAt).toLocaleString()}</span>
                ) : (
                  <span className="muted siobhan-when">{a.source}</span>
                )}
              </div>
              <SiobhanNewsComments
                articleKey={a.id.slice(0, 500)}
                userId={userId}
                profilesById={profilesById}
                onProfiles={onProfiles}
                uploadPicture={uploadPicture}
              />
            </article>
          ))
        )}
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
