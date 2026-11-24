// created: 2026-11-24T13:10:00-08:00 — manga-style scrolling science feed for Siobhan Daily
import { SIOBHAN_FEED } from '../lib/siobhanFeed'

const SCHOOL_URL = 'https://sites.google.com/opusd.us/siobhan/siobh%C3%A1n-daily'

/** created: 2026-11-24T13:10:00-08:00 */
export function SiobhanFeed() {
  return (
    <div className="siobhan-panel">
      <header className="siobhan-hero">
        <div className="siobhan-hero-badge" aria-hidden>
          📰✨
        </div>
        <div className="siobhan-hero-copy">
          <h2 className="panel-title">Siobhan Daily</h2>
          <p className="siobhan-tagline">Oak Park science scroll · manga panels · club vibes</p>
        </div>
        <a
          className="primary btn-compact siobhan-school-btn"
          href={SCHOOL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open school site
        </a>
      </header>

      <p className="siobhan-scroll-hint muted">Swipe the feed · local + classroom science</p>

      <div className="siobhan-feed" role="feed" aria-label="Siobhan science news">
        {SIOBHAN_FEED.map((a, i) => (
          <article
            key={a.id}
            className={`siobhan-panel-card tone-${(i % 4) + 1}`}
            aria-posinset={i + 1}
            aria-setsize={SIOBHAN_FEED.length}
          >
            <div className="siobhan-panel-chrome">
              <span className="siobhan-sticker" aria-hidden>
                {a.emoji}
              </span>
              <span className="siobhan-chip">{a.tag}</span>
              <span className="siobhan-place">{a.place}</span>
            </div>
            <h3 className="siobhan-title">{a.title}</h3>
            <p className="siobhan-blurb">{a.blurb}</p>
            <div className="siobhan-bubble">
              <span className="siobhan-bubble-label">Fun fact</span>
              <p>{a.funFact}</p>
            </div>
          </article>
        ))}
      </div>

      <footer className="siobhan-footer">
        <p className="muted">Want the real school paper?</p>
        <a
          className="ghost btn-compact"
          href={SCHOOL_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Click here to go to Siobhan Daily!
        </a>
      </footer>
    </div>
  )
}
