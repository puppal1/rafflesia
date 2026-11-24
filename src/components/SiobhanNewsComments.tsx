// created: 2026-11-24T13:25:00-08:00 — comments on Siobhan news cards
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { checkKidText, reportBlockedText } from '../lib/textChecker'
import { NameWithBadge } from './VerifiedBadge'
import type { Profile } from '../types'

export type NewsComment = {
  // created: 2026-11-24T13:25:00-08:00
  id: string
  article_key: string
  author_id: string
  body: string
  created_at: string
}

type Props = {
  // created: 2026-11-24T13:25:00-08:00
  articleKey: string
  userId: string
  profilesById: Record<string, Profile>
  onProfiles?: (rows: Profile[]) => void
}

/** created: 2026-11-24T13:25:00-08:00 */
export function SiobhanNewsComments({ articleKey, userId, profilesById, onProfiles }: Props) {
  const [open, setOpen] = useState(false)
  const [comments, setComments] = useState<NewsComment[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from('news_comments')
      .select('id, article_key, author_id, body, created_at')
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

  async function submit(e: FormEvent) {
    e.preventDefault()
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    setErr('')
    try {
      const check = await checkKidText(body)
      if (!check.ok) {
        await reportBlockedText('comment', body, check.matched)
        setErr(check.message)
        return
      }
      const { error } = await supabase.rpc('create_news_comment', {
        p_article_key: articleKey,
        p_body: body,
      })
      if (error) throw error
      setDraft('')
      await loadComments()
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : 'Could not comment.')
    } finally {
      setBusy(false)
    }
  }

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
            <p className="muted">No comments yet — say something kind about the story</p>
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
                    <button className="ghost btn-compact" type="button" disabled={busy} onClick={() => remove(c.id)}>
                      Delete
                    </button>
                  ) : null}
                </div>
              )
            })
          )}
          <form className="form form-compact comment-form" onSubmit={submit}>
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
              <button className="primary btn-compact" type="submit" disabled={busy || !draft.trim()}>
                Comment
              </button>
            </div>
          </form>
          {err ? <p className="error">{err}</p> : null}
        </div>
      ) : null}
    </div>
  )
}
