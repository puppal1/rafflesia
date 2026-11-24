// created: 2026-11-23T21:00:00-08:00
// updated: 2026-11-23T21:05:00-08:00 — password-gated teacher RPCs (no kid login required)
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from './lib/supabase'
import { clearBlockedPhraseCache } from './lib/textChecker'

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
  const [tab, setTab] = useState<'flags' | 'words' | 'restrict' | 'overview'>('flags')
  const [overview, setOverview] = useState<{ posts: number; chats: number; flags: number }>({
    posts: 0,
    chats: 0,
    flags: 0,
  })

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

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    const { data, error: err } = await supabase.rpc('verify_teacher_password', {
      p_password: password,
    })
    if (err) {
      // Fallback if phase5 SQL not applied yet
      if (password === 'teacher108') {
        setSessionPw(password)
        setAuthed(true)
        setStatus('SQL not fully applied — limited mode.')
        return
      }
      setError(err.message)
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
    const uname = restrictUser.trim().toLowerCase().replace(/^@/, '')
    const { data: uid, error: findErr } = await supabase.rpc('teacher_find_user', {
      p_password: sessionPw,
      p_username: uname,
    })
    if (findErr || !uid) {
      setError(findErr?.message || 'User not found.')
      return
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
    setStatus(`Updated restrictions for @${uname}.`)
  }

  async function unlockUser(e: FormEvent) {
    e.preventDefault()
    const uname = restrictUser.trim().toLowerCase().replace(/^@/, '')
    const { data: uid, error: findErr } = await supabase.rpc('teacher_find_user', {
      p_password: sessionPw,
      p_username: uname,
    })
    if (findErr || !uid) {
      setError(findErr?.message || 'User not found.')
      return
    }
    await supabase.rpc('teacher_set_restriction', {
      p_password: sessionPw,
      p_user_id: uid,
      p_block_post: false,
      p_block_message: false,
    })
    setStatus(`Unlocked @${uname}.`)
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
    <div className="teacher-console">
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
      <div className="nav">
        <button type="button" className={tab === 'flags' ? 'active' : ''} onClick={() => setTab('flags')}>
          Flagged
        </button>
        <button type="button" className={tab === 'restrict' ? 'active' : ''} onClick={() => setTab('restrict')}>
          Restrict
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
        <form className="form" onSubmit={applyRestrict}>
          <h2 className="panel-title">Restrict user</h2>
          <label>
            Username
            <input
              value={restrictUser}
              onChange={(e) => setRestrictUser(e.target.value)}
              placeholder="sam"
            />
          </label>
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
        </form>
      )}

      {tab === 'words' && (
        <div>
          <h2 className="panel-title">Blocked words</h2>
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
        </div>
      )}
    </div>
  )
}
