// created: 2026-11-24T21:55:00-08:00 — “Stories we talked about” engaged-history modal
import { useCallback, useEffect, useState } from 'react'
import {
  HISTORY_PAGE_SIZE,
  countNewsStoryHistory,
  historyRowToLiveItem,
  listNewsStoryHistory,
  type NewsHistoryRow,
} from '../lib/siobhanHistory'
import type { LiveNewsItem } from '../lib/siobhanNews'
import { SiobhanArticleReactions } from './SiobhanArticleReactions'

type Props = {
  // created: 2026-11-24T21:55:00-08:00
  open: boolean
  userId: string
  onClose: () => void
  onOpenComments: (item: LiveNewsItem) => void
  commentCounts: Record<string, number>
}

/** created: 2026-11-24T21:55:00-08:00 */
export function SiobhanTalkedAboutModal({
  open,
  userId,
  onClose,
  onOpenComments,
  commentCounts,
}: Props) {
  const [rows, setRows] = useState<NewsHistoryRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async (pageIndex: number) => {
    setBusy(true)
    setErr('')
    try {
      const offset = pageIndex * HISTORY_PAGE_SIZE
      const [list, count] = await Promise.all([
        listNewsStoryHistory(offset, HISTORY_PAGE_SIZE),
        countNewsStoryHistory(),
      ])
      setRows(list)
      setTotal(count)
      setPage(pageIndex)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not load stories.')
    } finally {
      setBusy(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    load(0).catch(() => undefined)
  }, [open, load])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const pageCount = Math.max(1, Math.ceil(total / HISTORY_PAGE_SIZE))
  const canPrev = page > 0
  const canNext = (page + 1) * HISTORY_PAGE_SIZE < total

  return (
    <div className="siobhan-history-overlay" role="dialog" aria-modal="true" aria-label="Stories we talked about">
      <button type="button" className="siobhan-history-backdrop" aria-label="Close" onClick={onClose} />
      <div className="siobhan-history-modal">
        <header className="siobhan-history-head">
          <div>
            <h2 className="siobhan-history-title">Stories we talked about</h2>
            <p className="muted siobhan-history-sub">
              Liked or commented · top buzz first · up to 50 kept
            </p>
          </div>
          <button type="button" className="ghost btn-compact" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="siobhan-history-body">
          {busy && rows.length === 0 ? <p className="muted">Loading…</p> : null}
          {err ? <p className="error">{err}</p> : null}
          {!busy && !err && rows.length === 0 ? (
            <p className="muted">No chats yet — like or comment on a live story to save it here.</p>
          ) : null}
          {rows.map((row, i) => {
            const item = historyRowToLiveItem(row)
            const key = row.article_key
            const comments = commentCounts[key] ?? row.comment_count
            return (
              <article
                key={key}
                className={`siobhan-panel-card siobhan-history-card tone-${(i % 4) + 1}`}
              >
                <div className="siobhan-panel-chrome">
                  <span className="siobhan-sticker" aria-hidden>
                    {row.emoji}
                  </span>
                  <span className="siobhan-chip">{row.tag || 'Story'}</span>
                  <span className="siobhan-history-score">
                    Buzz {row.engagement_score} · 💬 {comments} · 😊 {row.reaction_count}
                  </span>
                </div>
                <h3 className="siobhan-title">{row.title}</h3>
                {row.blurb ? <p className="siobhan-blurb">{row.blurb}</p> : null}
                <div className="siobhan-card-actions">
                  {row.url ? (
                    <a
                      className="primary btn-compact"
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                  ) : null}
                  <SiobhanArticleReactions articleKey={key} userId={userId} story={item} />
                  <button
                    className="ghost btn-compact"
                    type="button"
                    onClick={() => onOpenComments(item)}
                  >
                    {`Comments (${comments})`}
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <footer className="siobhan-history-pager">
          <button
            type="button"
            className="ghost btn-compact"
            disabled={!canPrev || busy}
            onClick={() => load(page - 1)}
          >
            ← Prev
          </button>
          <span className="muted">
            {total === 0 ? '0' : `${page + 1} / ${pageCount}`}
          </span>
          <button
            type="button"
            className="ghost btn-compact"
            disabled={!canNext || busy}
            onClick={() => load(page + 1)}
          >
            Next →
          </button>
        </footer>
      </div>
    </div>
  )
}
