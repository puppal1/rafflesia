// created: 2026-11-24T13:25:00-08:00 — comments on Siobhan news cards
// updated: 2026-11-24T14:05:00-08:00 — standard CommentComposer (emoji / link / photo)
// updated: 2026-11-24T13:58:00-08:00 — tap-to-enlarge comment photos
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { checkKidText, reportBlockedText } from '../lib/textChecker'
import { NameWithBadge } from './VerifiedBadge'
import { CommentComposer } from './CommentComposer'
import { MediaLightbox } from './MediaLightbox'
import type { Profile } from '../types'

export type NewsComment = {
  // created: 2026-11-24T13:25:00-08:00
  id: string
  article_key: string
  author_id: string
  body: string
  created_at: string
  media_url?: string | null
}

type Props = {
  // created: 2026-11-24T13:25:00-08:00
  articleKey: string
  userId: string
  profilesById: Record<string, Profile>
  onProfiles?: (rows: Profile[]) => void
  uploadPicture?: (file: File) => Promise<string>
}

/** created: 2026-11-24T13:25:00-08:00 */
/** updated: 2026-11-24T14:05:00-08:00 */
export function SiobhanNewsComments({
  articleKey,
  userId,
  profilesById,
  onProfiles,
  uploadPicture,
}: Props) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<NewsComment[]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('news_comments')
      .select('id, article_key, author_id, body, created_at, media_url')
      .eq('article_key', articleKey)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      setErr(
        error.message.includes('news_comments')
          ? 'Comments need sql-news-comments.sql — run in Supabase.'
          : error.message,
      )
      return
    }
    const rows = (data || []) as NewsComment[]
    setComments(rows)
    const missing = [...new Set(rows.map((c) => c.author_id))].filter((id) => !profilesById[id])
    if (missing.length && onProfiles) {
      const { data: profiles } = await supabase.from('profiles').select('*').in('id', missing)
      if (profiles?.length) onProfiles(profiles as Profile[])
    }
  }, [articleKey, onProfiles, profilesById])

  useEffect(() => {
    if (open) loadComments().catch(() => undefined)
  }, [open, loadComments])

  async function remove(id: string) {
    if (!window.confirm('Delete this comment?')) return
    setBusy(true)
    try {
      const { error } = await supabase.rpc('soft_delete_my_news_comment', { p_comment_id: id })
      if (error) throw error
      await loadComments()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not delete.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="siobhan-news-comments">
      <button className="ghost btn-compact" type="button" onClick={() => setOpen((v) => !v)}>
        {open ? 'Hide comments' : 'Comments'}
      </button>
      {open ? (
        <div className="post-comments">
          {comments.length === 0 ? (
            <p className="muted">No comments yet — say hi about the story</p>
          ) : (
            comments.map((c) => {
              const who = profilesById[c.author_id]
              const links = c.body.match(/https?:\/\/\S+/gi) || []
              return (
                <div className="post-comment" key={c.id}>
                  <p className="row-title">
                    <NameWithBadge
                      name={who?.display_name || who?.username || 'Friend'}
                      tier={who?.verify_tier}
                    />
                  </p>
                  <p className="profile-bio">{c.body}</p>
                  {c.media_url ? (
                    <button
                      type="button"
                      className="post-media-btn comment-media-btn"
                      onClick={() => setLightboxUrl(c.media_url!)}
                      aria-label="Enlarge comment picture"
                    >
                      <img className="comment-media" src={c.media_url} alt="" />
                      <span className="chat-media-hint">Tap to enlarge</span>
                    </button>
                  ) : null}
                  {links.length > 0 ? (
                    <p className="chat-msg-links">
                      {links.map((u) => (
                        <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                          Open link
                        </a>
                      ))}
                    </p>
                  ) : null}
                  {c.author_id === userId ? (
                    <button className="ghost btn-compact" type="button" disabled={busy} onClick={() => remove(c.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              )
            })
          )}
          <CommentComposer
            busy={busy}
            uploadPicture={uploadPicture}
            onSubmit={async ({ body, mediaUrl }) => {
              const check = await checkKidText(body)
              if (!check.ok) {
                await reportBlockedText('comment', body, check.matched)
                throw new Error(check.message)
              }
              const { error } = await supabase.rpc('create_news_comment', {
                p_article_key: articleKey,
                p_body: body,
                p_media_url: mediaUrl,
              })
              if (error) {
                if (/could not find the function|schema cache|create_news_comment/i.test(error.message)) {
                  throw new Error('Run docs/sql-news-comments.sql in Supabase, then hard refresh.')
                }
                throw new Error(error.message)
              }
              await loadComments()
            }}
          />
          {err ? <p className="error">{err}</p> : null}
        </div>
      ) : null}
      <MediaLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </div>
  )
}
