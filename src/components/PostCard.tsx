// created: 2026-11-24T12:35:00-08:00 — post card: media, comments, delete, send/share
// updated: 2026-11-24T12:55:00-08:00 — stacked layout (no action overlap)
// updated: 2026-11-24T13:35:00-08:00 — emoji likes, comment emoji + photo
// updated: 2026-11-24T13:58:00-08:00 — larger post images + tap-to-enlarge lightbox
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { checkKidText, reportBlockedText } from '../lib/textChecker'
import type { ReactionRow, ReactionTarget } from '../lib/reactions'
import { NameWithBadge } from './VerifiedBadge'
import { ReactionBar } from './ReactionBar'
import { CommentComposer } from './CommentComposer'
import { MediaLightbox } from './MediaLightbox'
import type { PostRow, Profile } from '../types'

export type PostComment = {
  // created: 2026-11-24T12:35:00-08:00
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
  deleted_at?: string | null
  media_url?: string | null
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
  uploadPicture?: (file: File) => Promise<string>
}

/** created: 2026-11-24T12:35:00-08:00 */
/** updated: 2026-11-24T13:58:00-08:00 */
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
  uploadPicture,
}: Props) {
  const [openComments, setOpenComments] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [localBusy, setLocalBusy] = useState(false)
  const [err, setErr] = useState('')
  const [reactions, setReactions] = useState<ReactionRow[]>([])
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const mine = post.author_id === userId

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', post.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
    if (error) {
      setErr(
        error.message.includes('post_comments')
          ? 'Comments need sql-post-comments.sql — run in Supabase.'
          : error.message,
      )
      return
    }
    setComments((data || []) as PostComment[])
  }, [post.id])

  const loadReactions = useCallback(async () => {
    // created: 2026-11-24T13:35:00-08:00
    const commentIds = comments.map((c) => c.id)
    const postRes = await supabase
      .from('content_reactions')
      .select('*')
      .eq('target_type', 'post')
      .eq('target_id', post.id)
    if (postRes.error) return
    let commentRows: ReactionRow[] = []
    if (commentIds.length) {
      const comRes = await supabase
        .from('content_reactions')
        .select('*')
        .eq('target_type', 'comment')
        .in('target_id', commentIds)
      if (!comRes.error) commentRows = (comRes.data || []) as ReactionRow[]
    }
    setReactions([...(postRes.data || []), ...commentRows] as ReactionRow[])
  }, [post.id, comments])

  useEffect(() => {
    if (openComments) loadComments().catch(() => undefined)
  }, [openComments, loadComments])

  useEffect(() => {
    loadReactions().catch(() => undefined)
  }, [loadReactions, openComments])

  async function react(targetType: ReactionTarget, targetId: string, emoji: string) {
    setLocalBusy(true)
    setErr('')
    try {
      const { error } = await supabase.rpc('set_content_reaction', {
        p_target_type: targetType,
        p_target_id: targetId,
        p_emoji: emoji,
      })
      if (error) {
        throw new Error(
          /content_reactions|set_content_reaction|schema cache/i.test(error.message)
            ? 'Run docs/sql-content-reactions.sql in Supabase, then hard refresh.'
            : error.message,
        )
      }
      await loadReactions()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not react.')
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
          <button
            type="button"
            className="post-media-btn"
            onClick={() => setLightboxUrl(post.media_url!)}
            aria-label="Enlarge picture"
          >
            <img className="post-media" src={post.media_url} alt="" loading="lazy" />
            <span className="chat-media-hint">Tap to enlarge</span>
          </button>
        ) : (
          <p className="post-card-missing-media">Picture missing a link.</p>
        )
      ) : null}
      {post.kind === 'video' ? (
        post.media_url ? (
          <video className="post-media post-media-video" src={post.media_url} controls playsInline />
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

      <ReactionBar
        targetType="post"
        targetId={post.id}
        userId={userId}
        rows={reactions}
        busy={localBusy || busy}
        onReact={react}
      />

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
            <p className="muted">No comments yet — say hi</p>
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
                  {(c.body.match(/https?:\/\/\S+/gi) || []).length > 0 ? (
                    <p className="chat-msg-links">
                      {(c.body.match(/https?:\/\/\S+/gi) || []).map((u) => (
                        <a key={u} href={u} target="_blank" rel="noopener noreferrer">
                          Open link
                        </a>
                      ))}
                    </p>
                  ) : null}
                  <ReactionBar
                    targetType="comment"
                    targetId={c.id}
                    userId={userId}
                    rows={reactions}
                    busy={localBusy || busy}
                    onReact={react}
                  />
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
          <CommentComposer
            busy={localBusy || busy}
            uploadPicture={uploadPicture}
            onSubmit={async ({ body, mediaUrl }) => {
              const check = await checkKidText(body)
              if (!check.ok) {
                await reportBlockedText('comment', body, check.matched)
                throw new Error(check.message)
              }
              const { error } = await supabase.rpc('create_post_comment', {
                p_post_id: post.id,
                p_body: body,
                p_media_url: mediaUrl,
              })
              if (error) {
                if (/ambiguous|block_post|deleted_at/i.test(error.message)) {
                  throw new Error('Run docs/sql-fix-comment-block-ambiguous.sql in Supabase, then hard refresh.')
                }
                throw new Error(error.message)
              }
              await loadComments()
              await loadReactions()
            }}
          />
        </div>
      ) : null}

      <MediaLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
    </article>
  )
}
