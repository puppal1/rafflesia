// created: 2026-11-24T12:35:00-08:00 — post card: media, comments, delete, send/share
// updated: 2026-11-24T12:55:00-08:00 — stacked layout (no action overlap)
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { checkKidText, reportBlockedText } from '../lib/textChecker'
import { NameWithBadge } from './VerifiedBadge'
import type { PostRow, Profile } from '../types'

export type PostComment = {
  // created: 2026-11-24T12:35:00-08:00
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
  deleted_at?: string | null
}

type Props = {
  // created: 2026-11-24T12:35:00-08:00
  post: PostRow
  userId: string
  authorName: string
  authorTier?: string | null
  profilesById: Record<string, Profile>
  busy?: boolean
  onDeleted: (postId: string) => void
  onSend: (post: PostRow) => void
  onShare: (post: PostRow) => void
  onOpenAuthor?: (authorId: string) => void
}

/** created: 2026-11-24T12:35:00-08:00 */
/** updated: 2026-11-24T12:55:00-08:00 */
export function PostCard({
  post,
  userId,
  authorName,
  authorTier,
  profilesById,
  busy,
  onDeleted,
  onSend,
  onShare,
  onOpenAuthor,
}: Props) {
  const [openComments, setOpenComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [draft, setDraft] = useState('')
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const mine = post.author_id === userId

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', post.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      setErr(error.message.includes('post_comments')
        ? 'Comments need sql-post-comments.sql — run in Supabase.'
        : error.message)
      return
    }
    setComments((data || []) as PostComment[])
  }, [post.id])

  useEffect(() => {
    if (openComments) loadComments().catch(() => undefined)
  }, [openComments, loadComments])

  async function submitComment(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setLocalBusy(true)
    setErr('')
    try {
      const check = await checkKidText(body)
      if (!check.ok) {
        await reportBlockedText('comment', body, check.matched)
        setErr(check.message)
        return
      }
      const { error } = await supabase.rpc('create_post_comment', {
        p_post_id: post.id,
        p_body: body,
      })
      if (error) throw error
      setDraft('')
      await loadComments()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not comment.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function deletePost() {
    if (!window.confirm('Delete this post?')) return
    setLocalBusy(true)
    try {
      const { error } = await supabase.rpc('soft_delete_my_post', { p_post_id: post.id })
      if (error) throw error
      onDeleted(post.id)
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not delete post.')
    } finally {
      setLocalBusy(false)
    }
  }

  async function deleteComment(id: string) {
    if (!window.confirm('Delete this comment?')) return
    setLocalBusy(true)
    try {
      const { error } = await supabase.rpc('soft_delete_my_comment', { p_comment_id: id })
      if (error) throw error
      await loadComments()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not delete comment.')
    } finally {
      setLocalBusy(false)
    }
  }

  const kindLabel =
    post.kind === 'picture'
      ? 'Picture'
      : post.kind === 'video'
        ? 'Video'
        : post.kind === 'link'
          ? 'Link'
          : 'Text'

  return (
    <article className="post-card">
      <header className="post-card-head">
        <button
          type="button"
          className="linkish-inline post-card-author"
          onClick={() => onOpenAuthor?.(post.author_id)}
        >
          <NameWithBadge name={authorName} tier={authorTier} />
        </button>
        <span className="post-card-kind">· {kindLabel}</span>
        <p className="post-card-time">{new Date(post.created_at).toLocaleString()}</p>
      </header>

      {post.body ? <p className="post-card-body">{post.body}</p> : null}

      {post.kind === 'picture' ? (
        post.media_url ? (
          <img className="post-media" src={post.media_url} alt="" loading="lazy" />
        ) : (
          <p className="post-card-missing-media">Picture missing a link.</p>
        )
      ) : null}
      {post.kind === 'video' ? (
        post.media_url ? (
          <video className="post-media" src={post.media_url} controls playsInline />
        ) : (
          <p className="post-card-missing-media">Video missing a link.</p>
        )
      ) : null}
      {post.kind === 'link' && post.media_url ? (
        <p className="post-card-link">
          <a href={post.media_url} target="_blank" rel="noreferrer">
            Open link
          </a>
        </p>
      ) : null}

      <div className="post-card-actions">
        <button className="ghost btn-compact" type="button" onClick={() => setOpenComments((v) => !v)}>
          {openComments ? 'Hide comments' : 'Comments'}
        </button>
        <button className="ghost btn-compact" type="button" disabled={busy || localBusy} onClick={() => onSend(post)}>
          Send
        </button>
        <button className="ghost btn-compact" type="button" disabled={busy || localBusy} onClick={() => onShare(post)}>
          Share
        </button>
        {mine ? (
          <button className="danger btn-compact" type="button" disabled={localBusy} onClick={deletePost}>
            Delete
          </button>
        ) : null}
      </div>

      {err ? <p className="error">{err}</p> : null}

      {openComments ? (
        <div className="post-comments">
          {comments.length === 0 ? (
            <p className="muted">No comments yet — say something kind</p>
          ) : (
            comments.map((c) => {
              const who = profilesById[c.author_id]
              return (
                <div className="post-comment" key={c.id}>
                  <p className="row-title">
                    <NameWithBadge
                      name={who?.display_name || who?.username || 'Friend'}
                      tier={who?.verify_tier}
                    />
                  </p>
                  <p className="profile-bio">{c.body}</p>
                  {c.author_id === userId ? (
                    <button
                      className="ghost btn-compact"
                      type="button"
                      disabled={localBusy}
                      onClick={() => deleteComment(c.id)}
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              )
            })
          )}
          <form className="form form-compact comment-form" onSubmit={submitComment}>
            <label>
              Add a comment
              <input
                value={draft}
                maxLength={500}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Be kind…"
              />
            </label>
            <div className="action-row">
              <button className="primary btn-compact" type="submit" disabled={localBusy || !draft.trim()}>
                Comment
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </article>
  )
}
