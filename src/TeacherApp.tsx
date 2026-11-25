// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T23:35:00-08:00 — Verify tab (pink / gold / blue)
import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import { clearBlockedPhraseCache } from './lib/textChecker'
import { iconEmoji } from './lib/iconPacks'
import { VerifiedBadge } from './components/VerifiedBadge'
import type { PostRow, VerifyTier } from './types'

type FlagRow = {
  // created: 2026-11-23T21:00:00-08:00
  id: string
  user_id: string
  username: string
  context: string
  body: string
  matched: string | null
  created_at: string
}

type SearchHit = {
  // created: 2026-11-23T21:35:00-08:00
  // updated: 2026-11-23T23:35:00-08:00 — verify_tier
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string | null
  banner_url: string | null
  icon_pack: string | null
  icon_id: string | null
  block_post: boolean
  block_message: boolean
  verify_tier?: string | null
}

type Props = {
  // created: 2026-11-23T21:00:00-08:00
  onExit: () => void
}

/** created: 2026-11-23T21:00:00-08:00 */
export function TeacherApp({ onExit }: Props) {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [sessionPw, setSessionPw] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [flags, setFlags] = useState<FlagRow[]>([])
  const [words, setWords] = useState<string[]>([])
  const [newWord, setNewWord] = useState('')
  const [restrictUser, setRestrictUser] = useState('')
  const [blockPost, setBlockPost] = useState(true)
  const [blockMsg, setBlockMsg] = useState(true)
  const [tab, setTab] = useState<'flags' | 'words' | 'restrict' | 'posts' | 'verify' | 'overview'>(
    'flags',
  )
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [overview, setOverview] = useState<{ posts: number; chats: number; flags: number }>({
    posts: 0,
    chats: 0,
    flags: 0,
  })
  // created: 2026-11-23T21:35:00-08:00
  const [hits, setHits] = useState<SearchHit[]>([])
  const [picked, setPicked] = useState<SearchHit | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchTimer = useRef<number | null>(null)
  // created: 2026-11-23T22:25:00-08:00
  const [userPosts, setUserPosts] = useState<PostRow[]>([])
  const [postsBusy, setPostsBusy] = useState(false)

  const loadAll = useCallback(async (pw: string) => {
    const [f, w, o] = await Promise.all([
      supabase.rpc('teacher_list_flags', { p_password: pw }),
      supabase.rpc('teacher_list_words', { p_password: pw }),
      supabase.rpc('teacher_overview', { p_password: pw }),
    ])
    if (f.error) throw f.error
    if (w.error) throw w.error
    if (o.error) throw o.error
    setFlags((f.data || []) as FlagRow[])
    setWords((w.data as string[]) || [])
    const ov = (o.data || {}) as { posts?: number; chats?: number; flags?: number }
    setOverview({ posts: ov.posts || 0, chats: ov.chats || 0, flags: ov.flags || 0 })
  }, [])

  useEffect(() => {
    if (!authed || !sessionPw) return
    loadAll(sessionPw).catch((err) => setError(err instanceof Error ? err.message : 'Load failed'))
  }, [authed, sessionPw, loadAll])

  function onRestrictQueryChange(value: string) {
    // created: 2026-11-23T21:35:00-08:00 — debounce typeahead
    setRestrictUser(value)
    setPicked(null)
    setSearchOpen(true)
    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    const q = value.trim()
    if (q.length < 1) {
      setHits([])
      return
    }
    searchTimer.current = window.setTimeout(async () => {
      const { data, error: err } = await supabase.rpc('teacher_search_users', {
        p_password: sessionPw,
        p_query: q,
      })
      if (err) {
        setError(
          err.message.includes('teacher_search_users')
            ? 'Search needs sql-phase5-patch-missing-rpcs.sql — run in Supabase.'
            : err.message,
        )
        setHits([])
        return
      }
      setHits((data || []) as SearchHit[])
    }, 220)
  }

  const loadUserPosts = useCallback(
    async (userId: string) => {
      // created: 2026-11-23T22:25:00-08:00
      const { data, error: err } = await supabase.rpc('teacher_list_user_posts', {
        p_password: sessionPw,
        p_user_id: userId,
      })
      if (err) {
        setError(
          err.message.includes('teacher_list_user_posts')
            ? 'Post moderation needs sql-teacher-moderation-posts.sql — run in Supabase.'
            : err.message,
        )
        setUserPosts([])
        return
      }
      setUserPosts((data || []) as PostRow[])
    },
    [sessionPw],
  )

  function pickHit(hit: SearchHit) {
    // created: 2026-11-23T21:35:00-08:00
    // updated: 2026-11-23T22:25:00-08:00 — also load posts for moderation
    setPicked(hit)
    setRestrictUser(hit.username)
    setHits([])
    setSearchOpen(false)
    setBlockPost(hit.block_post)
    setBlockMsg(hit.block_message)
    setStatus(`Selected @${hit.username}`)
    loadUserPosts(hit.id).catch(() => undefined)
  }

  async function softDeletePost(postId: string) {
    setPostsBusy(true)
    setError('')
    try {
      const { error: err } = await supabase.rpc('teacher_soft_delete_post', {
        p_password: sessionPw,
        p_post_id: postId,
        p_reason: 'teacher moderation',
      })
      if (err) throw err
      setStatus('Post hidden from Home (soft delete).')
      if (picked) await loadUserPosts(picked.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not hide post.')
    } finally {
      setPostsBusy(false)
    }
  }

  async function restorePost(postId: string) {
    setPostsBusy(true)
    setError('')
    try {
      const { error: err } = await supabase.rpc('teacher_restore_post', {
        p_password: sessionPw,
        p_post_id: postId,
      })
      if (err) throw err
      setStatus('Post restored to Home.')
      if (picked) await loadUserPosts(picked.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not restore post.')
    } finally {
      setPostsBusy(false)
    }
  }

  async function softDeleteAllPosts() {
    if (!picked) return
    if (!window.confirm(`Hide ALL visible posts from @${picked.username}?`)) return
    setPostsBusy(true)
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('teacher_soft_delete_user_posts', {
        p_password: sessionPw,
        p_user_id: picked.id,
        p_reason: 'teacher moderation',
      })
      if (err) throw err
      setStatus(`Hidden ${data ?? 0} posts from @${picked.username}.`)
      await loadUserPosts(picked.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not hide posts.')
    } finally {
      setPostsBusy(false)
    }
  }

  async function setVerify(tier: VerifyTier) {
    // created: 2026-11-23T23:35:00-08:00 — teacher-only badge assign
    if (!picked) {
      setError('Search and pick a person first.')
      return
    }
    setVerifyBusy(true)
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('teacher_set_verify', {
        p_password: sessionPw,
        p_user_id: picked.id,
        p_tier: tier || '',
      })
      if (err) {
        throw new Error(
          err.message.includes('teacher_set_verify')
            ? 'Verification needs sql-teacher-verify.sql — run in Supabase.'
            : err.message,
        )
      }
      const row = data as SearchHit
      setPicked({
        ...picked,
        verify_tier: row?.verify_tier ?? tier,
      })
      setStatus(
        tier
          ? `Set ${tier} verified on @${picked.username}.`
          : `Removed verification from @${picked.username}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set verification.')
    } finally {
      setVerifyBusy(false)
    }
  }

  function verifyLabel(tier?: string | null) {
    // created: 2026-11-23T23:35:00-08:00
    if (tier === 'pink') return 'Pink (creator / Rafflesia team)'
    if (tier === 'gold') return 'Gold (honour / brand)'
    if (tier === 'blue') return 'Blue (regular verified)'
    return 'Not verified'
  }

  async function onLogin(e: FormEvent) {
    // updated: 2026-11-24T22:50:00-08:00 — DB password only (no client fallback)
    e.preventDefault()
    setError('')
    const { data, error: err } = await supabase.rpc('verify_teacher_password', {
      p_password: password,
    })
    if (err) {
      setError(
        /verify_teacher_password|schema cache|Could not find the function/i.test(err.message)
          ? 'Teacher login needs SQL applied in Supabase (verify_teacher_password).'
          : err.message,
      )
      return
    }
    if (data === true) {
      setSessionPw(password)
      setAuthed(true)
    } else setError('Wrong teacher password.')
  }

  async function addWord(e: FormEvent) {
    e.preventDefault()
    const phrase = newWord.trim()
    if (!phrase) return
    setError('')
    const { error: err } = await supabase.rpc('teacher_add_blocked_word', {
      p_password: sessionPw,
      p_phrase: phrase,
      p_kind: 'bad',
    })
    if (err) {
      setError(err.message)
      return
    }
    setNewWord('')
    clearBlockedPhraseCache()
    setStatus('Word added.')
    await loadAll(sessionPw)
  }

  async function removeWord(phrase: string) {
    setError('')
    const { error: err } = await supabase.rpc('teacher_remove_blocked_word', {
      p_password: sessionPw,
      p_phrase: phrase,
    })
    if (err) {
      setError(err.message)
      return
    }
    clearBlockedPhraseCache()
    await loadAll(sessionPw)
  }

  async function applyRestrict(e: FormEvent) {
    e.preventDefault()
    setError('')
    let uid = picked?.id
    if (!uid) {
      const uname = restrictUser.trim().toLowerCase().replace(/^@/, '')
      const { data, error: findErr } = await supabase.rpc('teacher_find_user', {
        p_password: sessionPw,
        p_username: uname,
      })
      if (findErr || !data) {
        setError(findErr?.message || 'User not found. Type a few letters and pick from the list.')
        return
      }
      uid = data as string
    }
    const { error: err } = await supabase.rpc('teacher_set_restriction', {
      p_password: sessionPw,
      p_user_id: uid,
      p_block_post: blockPost,
      p_block_message: blockMsg,
    })
    if (err) {
      setError(err.message)
      return
    }
    setStatus(`Updated restrictions for @${restrictUser.trim().replace(/^@/, '')}.`)
    if (picked) {
      setPicked({ ...picked, block_post: blockPost, block_message: blockMsg })
    }
  }

  async function unlockUser(e: FormEvent) {
    e.preventDefault()
    setBlockPost(false)
    setBlockMsg(false)
    let uid = picked?.id
    if (!uid) {
      const uname = restrictUser.trim().toLowerCase().replace(/^@/, '')
      const { data, error: findErr } = await supabase.rpc('teacher_find_user', {
        p_password: sessionPw,
        p_username: uname,
      })
      if (findErr || !data) {
        setError(findErr?.message || 'User not found.')
        return
      }
      uid = data as string
    }
    await supabase.rpc('teacher_set_restriction', {
      p_password: sessionPw,
      p_user_id: uid,
      p_block_post: false,
      p_block_message: false,
    })
    setStatus(`Unlocked @${restrictUser.trim().replace(/^@/, '')}.`)
    if (picked) setPicked({ ...picked, block_post: false, block_message: false })
  }

  if (!authed) {
    return (
      <div className="teacher-login">
        <h2 className="panel-title">Teacher access</h2>
        <p className="muted">Separate from kid accounts</p>
        <form className="form" onSubmit={onLogin}>
          <label>
            Teacher password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <button className="primary" type="submit">
            Enter console
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
        <button className="ghost" type="button" onClick={onExit} style={{ marginTop: 12 }}>
          ← Back to kids login
        </button>
      </div>
    )
  }

  return (
    <div className="teacher-console app-with-rail">
      <div className="app-main-col">
      <div className="header-bar">
        <div>
          <h1 className="brand">Teacher console</h1>
          <p className="tag" style={{ marginBottom: 0 }}>
            Rafflesia safety
          </p>
        </div>
        <button className="ghost" type="button" onClick={onExit}>
          Exit
        </button>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {status ? <p className="muted">{status}</p> : null}

      {tab === 'flags' && (
        <div>
          <h2 className="panel-title">Flagged attempts</h2>
          <div className="list">
            {flags.length === 0 ? (
              <p className="muted">No flags yet.</p>
            ) : (
              flags.map((f) => (
                <div className="row" key={f.id}>
                  <div className="row-main">
                    <p className="row-title">
                      @{f.username} · {f.context}
                    </p>
                    <p className="row-sub">
                      {new Date(f.created_at).toLocaleString()} · matched: {f.matched || '—'}
                    </p>
                    <p className="row-sub">{f.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === 'restrict' && (
        <form className="form" onSubmit={applyRestrict} autoComplete="off">
          <h2 className="panel-title">Restrict user</h2>
          <label className="typeahead-wrap">
            Search username
            <input
              value={restrictUser}
              onChange={(e) => onRestrictQueryChange(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Start typing a name…"
            />
            {searchOpen && hits.length > 0 ? (
              <ul className="typeahead-list">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="typeahead-item" onClick={() => pickHit(h)}>
                      <span>
                        {iconEmoji(h.icon_pack, h.icon_id)} <strong>@{h.username}</strong>{' '}
                        <VerifiedBadge tier={h.verify_tier} />
                      </span>
                      <span className="muted">{h.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </label>

          {picked ? (
            <div className="teacher-profile-card">
              {/* created: 2026-11-23T21:35:00-08:00 */}
              {picked.banner_url ? (
                <img className="banner-preview" src={picked.banner_url} alt="" />
              ) : (
                <div className="banner-preview placeholder">No banner</div>
              )}
              {picked.avatar_url ? (
                <img className="avatar-preview" src={picked.avatar_url} alt="" />
              ) : (
                <div className="avatar-preview placeholder">
                  {iconEmoji(picked.icon_pack, picked.icon_id)}
                </div>
              )}
              <p className="row-title">
                {iconEmoji(picked.icon_pack, picked.icon_id)} {picked.display_name}
              </p>
              <p className="muted">@{picked.username}</p>
              <p className="profile-bio">{(picked.bio || '').trim() || 'No bio.'}</p>
              <p className="muted">
                Posting: {picked.block_post ? 'blocked' : 'ok'} · Messaging:{' '}
                {picked.block_message ? 'blocked' : 'ok'}
              </p>
            </div>
          ) : (
            <p className="muted">Pick a kid from the suggestions to see their profile.</p>
          )}

          <label className="member-check">
            <input type="checkbox" checked={blockPost} onChange={(e) => setBlockPost(e.target.checked)} />
            Block posting
          </label>
          <label className="member-check">
            <input type="checkbox" checked={blockMsg} onChange={(e) => setBlockMsg(e.target.checked)} />
            Block messaging
          </label>
          <div className="row" style={{ gap: 8, marginTop: 8 }}>
            <button className="danger grow" type="submit">
              Restrict
            </button>
            <button className="ghost grow" type="button" onClick={unlockUser}>
              Unlock
            </button>
          </div>
          {picked ? (
            <button
              className="ghost"
              type="button"
              style={{ marginTop: 10 }}
              onClick={() => {
                setTab('posts')
                loadUserPosts(picked.id).catch(() => undefined)
              }}
            >
              Review / hide @{picked.username}&apos;s posts →
            </button>
          ) : null}
        </form>
      )}

      {tab === 'posts' && (
        <div>
          <h2 className="panel-title">Moderate posts</h2>
          <p className="muted">
            Soft-delete hides a post from Home. Restrict alone does not remove old posts.
          </p>
          {!picked ? (
            <p className="muted">First pick a student under Restrict (search), then come back here.</p>
          ) : (
            <>
              <p className="row-title">
                @{picked.username} · {userPosts.filter((p) => !p.deleted_at).length} visible ·{' '}
                {userPosts.filter((p) => p.deleted_at).length} hidden
              </p>
              <button
                className="danger"
                type="button"
                disabled={postsBusy || userPosts.every((p) => p.deleted_at)}
                onClick={softDeleteAllPosts}
                style={{ marginBottom: 12 }}
              >
                Hide all visible posts
              </button>
              <div className="list soft-scroll" style={{ maxHeight: 420 }}>
                {userPosts.length === 0 ? (
                  <p className="muted">No posts from this user.</p>
                ) : (
                  userPosts.map((p) => (
                    <div className={p.deleted_at ? 'row post-mod hidden' : 'row post-mod'} key={p.id}>
                      <div className="row-main">
                        <p className="row-title">
                          {p.kind}
                          {p.deleted_at ? ' · HIDDEN' : ''}
                        </p>
                        <p className="row-sub">{new Date(p.created_at).toLocaleString()}</p>
                        {p.body ? <p className="profile-bio">{p.body}</p> : null}
                        {p.media_url ? (
                          <p className="row-sub">
                            <a href={p.media_url} target="_blank" rel="noreferrer">
                              Media link
                            </a>
                          </p>
                        ) : null}
                      </div>
                      <div className="row-actions">
                        {p.deleted_at ? (
                          <button
                            className="ghost"
                            type="button"
                            disabled={postsBusy}
                            onClick={() => restorePost(p.id)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            className="danger"
                            type="button"
                            disabled={postsBusy}
                            onClick={() => softDeletePost(p.id)}
                          >
                            Hide
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'verify' && (
        <div>
          {/* created: 2026-11-23T23:35:00-08:00 */}
          <h2 className="panel-title">Verify people</h2>
          <p className="muted">
            Only teachers can grant checks. Pink = Rafflesia creators · Gold = honour / brand · Blue =
            regular verified.
          </p>
          <label className="typeahead-wrap field">
            Search username
            <input
              value={restrictUser}
              onChange={(e) => onRestrictQueryChange(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              placeholder="Start typing a name…"
            />
            {searchOpen && hits.length > 0 ? (
              <ul className="typeahead-list">
                {hits.map((h) => (
                  <li key={h.id}>
                    <button type="button" className="typeahead-item" onClick={() => pickHit(h)}>
                      <span>
                        {iconEmoji(h.icon_pack, h.icon_id)} <strong>@{h.username}</strong>{' '}
                        <VerifiedBadge tier={h.verify_tier} />
                      </span>
                      <span className="muted">{h.display_name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </label>

          {picked ? (
            <div className="teacher-profile-card">
              <p className="row-title">
                {iconEmoji(picked.icon_pack, picked.icon_id)} {picked.display_name}{' '}
                <VerifiedBadge tier={picked.verify_tier} />
              </p>
              <p className="muted">@{picked.username}</p>
              <p className="muted">Current: {verifyLabel(picked.verify_tier)}</p>
              <div className="verify-tier-row">
                <button
                  className="primary pink"
                  type="button"
                  disabled={verifyBusy}
                  onClick={() => setVerify('pink')}
                >
                  Pink check
                </button>
                <button
                  className="primary gold"
                  type="button"
                  disabled={verifyBusy}
                  onClick={() => setVerify('gold')}
                >
                  Gold check
                </button>
                <button
                  className="primary blue"
                  type="button"
                  disabled={verifyBusy}
                  onClick={() => setVerify('blue')}
                >
                  Blue check
                </button>
                <button
                  className="ghost"
                  type="button"
                  disabled={verifyBusy || !picked.verify_tier}
                  onClick={() => setVerify(null)}
                >
                  Remove check
                </button>
              </div>
            </div>
          ) : (
            <p className="muted">Pick a person from search to verify them.</p>
          )}
        </div>
      )}

      {tab === 'words' && (
        <div>
          <h2 className="panel-title">Blocked words</h2>
          <p className="muted">Applies to messages, bios, posts, display names, and usernames.</p>
          <div className="word-chips">
            {words.map((w) => (
              <button key={w} type="button" className="chip" onClick={() => removeWord(w)}>
                {w} ×
              </button>
            ))}
          </div>
          <form className="composer" onSubmit={addWord}>
            <input
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add phrase"
            />
            <button className="primary" type="submit">
              Add
            </button>
          </form>
        </div>
      )}

      {tab === 'overview' && (
        <div>
          <h2 className="panel-title">Club overview</h2>
          <p className="muted">Posts in club: {overview.posts}</p>
          <p className="muted">Chats in club: {overview.chats}</p>
          <p className="muted">Flags: {overview.flags}</p>
          <p className="muted">Blocked phrases: {words.length}</p>
        </div>
      )}
      </div>
      {/* created: 2026-11-23T23:45:00-08:00 — teacher tabs on right */}
      <nav className="nav nav-shell nav-rail" aria-label="Teacher">
        <button type="button" className={tab === 'flags' ? 'active' : ''} onClick={() => setTab('flags')}>
          Flagged
        </button>
        <button
          type="button"
          className={tab === 'restrict' ? 'active' : ''}
          onClick={() => setTab('restrict')}
        >
          Restrict
        </button>
        <button type="button" className={tab === 'posts' ? 'active' : ''} onClick={() => setTab('posts')}>
          Posts
        </button>
        <button type="button" className={tab === 'verify' ? 'active' : ''} onClick={() => setTab('verify')}>
          Verify
        </button>
        <button type="button" className={tab === 'words' ? 'active' : ''} onClick={() => setTab('words')}>
          Words
        </button>
        <button
          type="button"
          className={tab === 'overview' ? 'active' : ''}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
      </nav>
    </div>
  )
}
