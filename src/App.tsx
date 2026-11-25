// created: 2026-11-23T11:59:00-08:00
// updated: 2026-11-24T11:30:00-08:00 — reliable muted intro + corner controls
// updated: 2026-11-24T11:50:00-08:00 — theme engine + ThemePicker on login
// updated: 2026-11-24T12:35:00-08:00 — ToS/Privacy signup consent (PRD v2 B1)
// updated: 2026-11-24T22:50:00-08:00 — school-site soft gate + lax auth challenge
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomeApp } from './HomeApp'
import { TeacherApp } from './TeacherApp'
import { AuthChallenge } from './components/AuthChallenge'
import { ThemePicker } from './components/ThemePicker'
import { EmojiBar, insertEmojiAtCursor } from './lib/emojiBar'
import {
  bumpAuthFail,
  classifyAuthEntry,
  clearAuthFails,
  needsAuthChallenge,
} from './lib/authEntry'
import { ensureHourlyTheme } from './lib/themeEngine'
import { supabase } from './lib/supabase'
import { PRIVACY_VERSION, TOS_PRIVACY_TEXT, TOS_VERSION } from './lib/tosCopy'

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
  // created: 2026-11-24T12:35:00-08:00 — ToS gate
  const [tosAgreed, setTosAgreed] = useState(false)
  // created: 2026-11-24T22:50:00-08:00 — soft school / off-site challenge
  const entry = useMemo(() => classifyAuthEntry(), [])
  const [failTick, setFailTick] = useState(0)
  const challengeNeeded = useMemo(
    () => needsAuthChallenge(entry, mode),
    // failTick re-reads sessionStorage via needsAuthChallenge
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [entry, mode, failTick],
  )
  const [challengeOk, setChallengeOk] = useState(true)
  const onChallengePassed = useCallback((ok: boolean) => setChallengeOk(ok), [])
  // created: 2026-11-23T23:05:00-08:00 — play intro before login UI
  // updated: 2026-11-24T11:40:00-08:00 — unmuted by default; mute only if browser blocks
  const [showIntro, setShowIntro] = useState(true)
  const [introMuted, setIntroMuted] = useState(false)
  const [introPaused, setIntroPaused] = useState(false)
  const introVideoRef = useRef<HTMLVideoElement | null>(null)
  const introStartedRef = useRef(false)

  useEffect(() => {
    // updated: 2026-11-24T22:50:00-08:00 — reset challenge when mode / fail streak flips
    setChallengeOk(!challengeNeeded)
  }, [challengeNeeded])

  useEffect(() => {
    // created: 2026-11-24T11:50:00-08:00 — boot theme; locked picks never rotate
    ensureHourlyTheme()
    const id = window.setInterval(() => ensureHourlyTheme(), 60_000)
    return () => window.clearInterval(id)
  }, [])

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
    // created: 2026-11-24T11:30:00-08:00
    // updated: 2026-11-24T11:40:00-08:00 — prefer unmuted; fallback mute if autoplay blocked
    if (!showIntro || user) return
    const el = introVideoRef.current
    if (!el) return
    let cancelled = false
    el.volume = 1
    const tryPlay = (withSound: boolean) => {
      if (cancelled || !el) return
      el.defaultMuted = !withSound
      el.muted = !withSound
      const p = el.play()
      if (p && typeof p.then === 'function') {
        p.then(() => {
          if (cancelled) return
          introStartedRef.current = true
          setIntroMuted(!withSound)
          setIntroPaused(false)
        }).catch(() => {
          if (cancelled) return
          if (withSound) {
            // browser blocked sound autoplay — keep playing muted
            tryPlay(false)
          } else {
            setIntroPaused(true)
          }
        })
      }
    }
    const start = () => tryPlay(true)
    if (el.readyState >= 2) start()
    else el.addEventListener('loadeddata', start, { once: true })
    return () => {
      cancelled = true
      el.removeEventListener('loadeddata', start)
    }
  }, [showIntro, user])

  function finishIntro() {
    // created: 2026-11-23T23:05:00-08:00
    const el = introVideoRef.current
    if (el) {
      el.pause()
    }
    setShowIntro(false)
    setIntroPaused(false)
  }

  function playIntroFromTap() {
    // created: 2026-11-24T11:30:00-08:00 — resume without resetting to 0
    const el = introVideoRef.current
    if (!el) {
      finishIntro()
      return
    }
    el.muted = introMuted
    el.play()
      .then(() => {
        introStartedRef.current = true
        setIntroPaused(false)
      })
      .catch(() => finishIntro())
  }

  function toggleIntroMute() {
    // created: 2026-11-24T11:30:00-08:00
    const el = introVideoRef.current
    if (!el) return
    const next = !introMuted
    el.muted = next
    setIntroMuted(next)
    if (!next) {
      el.play().catch(() => undefined)
    }
  }

  async function onSubmit(e: FormEvent) {
    // created: 2026-11-23T11:59:00-08:00
    // updated: 2026-11-24T22:50:00-08:00 — soft school gate + challenge + fail streak
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      if (!password) {
        throw new Error('Please enter a username and password.')
      }

      const needChallenge = needsAuthChallenge(entry, mode)
      if (needChallenge && !challengeOk) {
        throw new Error('Complete the quick check before continuing.')
      }

      // created: 2026-11-24T22:50:00-08:00 — visibility for teachers (console only; soft signal)
      console.info('[auth-entry]', entry.source, entry.reason, entry.inIframe ? 'iframe' : 'top')

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
        if (!tosAgreed) {
          throw new Error('Please agree to the Terms of Service and Privacy Policy.')
        }
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
        await supabase.rpc('join_lounge_announcements')
        // created: 2026-11-24T12:35:00-08:00 — consent ledger
        await supabase.rpc('record_signup_consent', {
          p_username: cleanUser,
          p_tos_version: TOS_VERSION,
          p_privacy_version: PRIVACY_VERSION,
          p_ip_address: null,
          p_device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : null,
        })
        clearAuthFails()
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          bumpAuthFail()
          setFailTick((n) => n + 1)
          throw signInError
        }
        clearAuthFails()
        setFailTick(0)
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
  // updated: 2026-11-24T11:30:00-08:00 — quiet corner controls; no center overlay
  if (showIntro && !user && !teacherMode) {
    return (
      <div className="intro-shell">
        <video
          ref={introVideoRef}
          className="intro-video"
          src={introSrc}
          playsInline
          muted
          autoPlay
          preload="auto"
          onEnded={finishIntro}
          onError={finishIntro}
          onPause={() => {
            if (showIntro && introStartedRef.current) setIntroPaused(true)
          }}
          onPlaying={() => setIntroPaused(false)}
          onClick={() => {
            if (introPaused) playIntroFromTap()
          }}
        />
        <div className="intro-chrome">
          {introPaused ? (
            <button className="intro-chip" type="button" onClick={playIntroFromTap}>
              Play
            </button>
          ) : (
            <button className="intro-chip" type="button" onClick={toggleIntroMute}>
              {introMuted ? 'Unmute' : 'Mute'}
            </button>
          )}
          <button className="intro-chip intro-chip-skip" type="button" onClick={finishIntro}>
            Skip
          </button>
        </div>
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
          <div className="auth-panel">
            {/* updated: 2026-11-24T12:15:00-08:00 — compact auth; content > buttons */}
            <img className="logo" src={logoSrc} alt="Rafflesia Online logo" />
            <h1 className="brand">Rafflesia Online</h1>
            <p className="tag">Rafflesia Channel Entertainment</p>
            {/* created: 2026-11-24T11:50:00-08:00 — pick locks; Auto resumes hourly */}
            <ThemePicker />

            <div className="tabs tabs-compact">
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

            <form className="form form-compact" onSubmit={onSubmit}>
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
              {mode === 'signup' ? (
                <div className="tos-block">
                  {/* created: 2026-11-24T12:35:00-08:00 */}
                  <p className="friend-pick-heading">Terms &amp; Privacy</p>
                  <pre className="tos-scroll">{TOS_PRIVACY_TEXT}</pre>
                  <label className="tos-check">
                    <input
                      type="checkbox"
                      checked={tosAgreed}
                      onChange={(e) => setTosAgreed(e.target.checked)}
                    />
                    <span>I agree to the Terms of Service and Privacy Policy</span>
                  </label>
                </div>
              ) : null}
              {/* created: 2026-11-24T22:50:00-08:00 */}
              {entry.source === 'offsite' ? (
                <p className="muted" style={{ fontSize: '0.8rem' }}>
                  Tip: open Rafflesia from the school Site for the smoothest login.
                </p>
              ) : null}
              <AuthChallenge
                required={challengeNeeded}
                onPassed={onChallengePassed}
                hint={
                  entry.source === 'offsite'
                    ? 'Off-site check — answer to continue.'
                    : 'Quick check after a few failed tries.'
                }
              />
              <div className="action-row">
                <button
                  className="primary"
                  type="submit"
                  disabled={
                    busy ||
                    (mode === 'signup' && !tosAgreed) ||
                    (challengeNeeded && !challengeOk)
                  }
                >
                  {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
                </button>
              </div>
            </form>
            {error ? <p className="error">{error}</p> : null}
            {/* created: 2026-11-23T21:05:00-08:00 */}
            <button
              className="ghost teacher-link"
              type="button"
              onClick={() => setTeacherMode(true)}
            >
              Teacher access
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
