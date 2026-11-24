// created: 2026-11-23T11:59:00-08:00
// updated: 2026-11-23T23:05:00-08:00 — intro video before login
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomeApp } from './HomeApp'
import { TeacherApp } from './TeacherApp'
import { EmojiBar, insertEmojiAtCursor } from './lib/emojiBar'
import { supabase } from './lib/supabase'
import {
  DISPLAY_NAME_MAX,
  USERNAME_MAX,
  findUsernameConflict,
  validateDisplayName,
  validateUsernameShape,
} from './lib/usernameRules'
import { checkKidText, reportBlockedText } from './lib/textChecker'
import './App.css'

const logoSrc = `${import.meta.env.BASE_URL}logo.jpg`
const introSrc = `${import.meta.env.BASE_URL}intro.mp4`

type Mode = 'login' | 'signup'

function toAuthEmail(username: string) {
  // created: 2026-11-23T11:59:00-08:00
  return `${username.trim().toLowerCase()}@rafflesia.local`
}

function App() {
  // created: 2026-11-23T11:59:00-08:00
  // updated: 2026-11-23T21:05:00-08:00 — teacherMode
  const [mode, setMode] = useState<Mode>('signup')
  const [user, setUser] = useState<User | null>(null)
  const [teacherMode, setTeacherMode] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // created: 2026-11-23T20:34:00-08:00
  const displayNameRef = useRef<HTMLInputElement | null>(null)
  // updated: 2026-11-23T21:55:00-08:00 — emoji picker closed by default
  const [showSignupEmoji, setShowSignupEmoji] = useState(false)
  // created: 2026-11-23T23:05:00-08:00 — play intro before login UI
  const [showIntro, setShowIntro] = useState(true)
  const [introNeedsTap, setIntroNeedsTap] = useState(false)
  const introVideoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    // created: 2026-11-23T11:59:00-08:00
    supabase.auth.getSession().then(({ data }) => {
      const next = data.session?.user ?? null
      setUser(next)
      // already signed in → skip intro, go straight into the app
      if (next) setShowIntro(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // created: 2026-11-23T23:05:00-08:00
    // updated: 2026-11-23T23:10:00-08:00 — always prefer audio; tap if browser blocks
    if (!showIntro || user) return
    const el = introVideoRef.current
    if (!el) return
    el.muted = false
    el.volume = 1
    const play = el.play()
    if (play && typeof play.then === 'function') {
      play.catch(() => setIntroNeedsTap(true))
    }
  }, [showIntro, user])

  function finishIntro() {
    // created: 2026-11-23T23:05:00-08:00
    setShowIntro(false)
    setIntroNeedsTap(false)
  }

  function startIntroWithTap() {
    // created: 2026-11-23T23:05:00-08:00 — unlock audio with a user gesture
    const el = introVideoRef.current
    if (!el) {
      finishIntro()
      return
    }
    setIntroNeedsTap(false)
    el.muted = false
    el.volume = 1
    el.currentTime = 0
    el.play().catch(() => finishIntro())
  }

  async function onSubmit(e: FormEvent) {
    // created: 2026-11-23T11:59:00-08:00
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (!password) {
        throw new Error('Please enter a username and password.')
      }

      const shape = validateUsernameShape(username)
      if (!shape.ok) throw new Error(shape.message)
      const cleanUser = shape.username
      const cleanDisplay = displayName.trim() || cleanUser
      const displayErr = validateDisplayName(cleanDisplay)
      if (displayErr) throw new Error(displayErr.message)
      // created: 2026-11-23T21:35:00-08:00 — teacher DB phrases on signup text
      if (mode === 'signup') {
        const uCheck = await checkKidText(cleanUser)
        if (!uCheck.ok) {
          await reportBlockedText('username', cleanUser, uCheck.matched)
          throw new Error(uCheck.message)
        }
        const dCheck = await checkKidText(cleanDisplay)
        if (!dCheck.ok) {
          await reportBlockedText('display_name', cleanDisplay, dCheck.matched)
          throw new Error(dCheck.message)
        }
      }

      const email = toAuthEmail(cleanUser)

      if (mode === 'signup') {
        // created: 2026-11-23T19:55:00-08:00 — exact duplicate vs existing usernames
        // updated: 2026-11-23T19:59:00-08:00 — similarity check removed
        const { data: existingRows, error: listError } = await supabase
          .from('profiles')
          .select('username')
        if (listError) throw listError
        const conflict = findUsernameConflict(
          cleanUser,
          (existingRows || []).map((r) => String(r.username || '')),
        )
        if (conflict) throw new Error(conflict.message)

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        if (!data.user) throw new Error('Could not create account.')

        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: cleanUser,
          display_name: cleanDisplay.slice(0, DISPLAY_NAME_MAX),
          bio: '',
        })
        if (profileError) {
          const msg = profileError.message || ''
          if (/duplicate|unique/i.test(msg)) {
            throw new Error('That username is already taken. Please choose a new one.')
          }
          throw profileError
        }
        // created: 2026-11-23T22:35:00-08:00 — Everyone lounge (trigger also joins)
        await supabase.rpc('join_lounge_everyone')
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
    } finally {
      setBusy(false)
    }
  }

  async function onLogout() {
    // created: 2026-11-23T11:59:00-08:00
    await supabase.auth.signOut()
  }

  // created: 2026-11-23T23:05:00-08:00 — full-screen intro before login
  // updated: 2026-11-23T23:10:00-08:00 — cropped + audio, no skip
  if (showIntro && !user && !teacherMode) {
    return (
      <div className="intro-shell" onClick={introNeedsTap ? startIntroWithTap : undefined}>
        <video
          ref={introVideoRef}
          className="intro-video"
          src={introSrc}
          playsInline
          autoPlay
          preload="auto"
          onEnded={finishIntro}
          onError={finishIntro}
        />
        {introNeedsTap ? (
          <button className="primary intro-tap" type="button" onClick={startIntroWithTap}>
            Tap for sound
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="app-shell">
      <div className="glass-card">
        {teacherMode ? (
          <TeacherApp onExit={() => setTeacherMode(false)} />
        ) : user ? (
          <HomeApp userId={user.id} onLogout={onLogout} />
        ) : (
          <>
            <img className="logo" src={logoSrc} alt="Rafflesia Online logo" />
            <h1 className="brand">Rafflesia Online</h1>
            <p className="tag">Rafflesia Channel Entertainment</p>

            <div className="tabs">
              <button
                type="button"
                className={mode === 'signup' ? 'active' : ''}
                onClick={() => setMode('signup')}
              >
                Sign up
              </button>
              <button
                type="button"
                className={mode === 'login' ? 'active' : ''}
                onClick={() => setMode('login')}
              >
                Log in
              </button>
            </div>

            <form className="form" onSubmit={onSubmit}>
              {mode === 'signup' && (
                <>
                  <label>
                    Display name
                    <input
                      ref={displayNameRef}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, DISPLAY_NAME_MAX))}
                      placeholder="What friends see 😎"
                      autoComplete="nickname"
                      maxLength={DISPLAY_NAME_MAX}
                    />
                  </label>
                  {/* created: 2026-11-23T20:34:00-08:00 */}
                  <EmojiBar
                    label="Emoji"
                    open={showSignupEmoji}
                    onToggle={() => setShowSignupEmoji((v) => !v)}
                    onPick={(emoji) =>
                      insertEmojiAtCursor(displayNameRef.current, displayName, (next) => {
                        setDisplayName(next.slice(0, DISPLAY_NAME_MAX))
                      }, emoji)
                    }
                  />
                </>
              )}
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.slice(0, USERNAME_MAX))}
                  placeholder="yourname"
                  autoComplete="username"
                  maxLength={USERNAME_MAX}
                  required
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  required
                />
              </label>
              <button className="primary" type="submit" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
              </button>
            </form>
            {error ? <p className="error">{error}</p> : null}
            {/* created: 2026-11-23T21:05:00-08:00 */}
            <button
              className="ghost teacher-link"
              type="button"
              onClick={() => setTeacherMode(true)}
              style={{ marginTop: 14 }}
            >
              Teacher access
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default App
