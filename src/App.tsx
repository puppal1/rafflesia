// created: 2026-11-23T11:59:00-08:00
// updated: 2026-11-23T19:55:00-08:00 — username max/vulgar/duplicate/similarity checks
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomeApp } from './HomeApp'
import { supabase } from './lib/supabase'
import {
  DISPLAY_NAME_MAX,
  USERNAME_MAX,
  findUsernameConflict,
  validateDisplayName,
  validateUsernameShape,
} from './lib/usernameRules'
import './App.css'

const logoSrc = `${import.meta.env.BASE_URL}logo.jpg`

type Mode = 'login' | 'signup'

function toAuthEmail(username: string) {
  // created: 2026-11-23T11:59:00-08:00
  return `${username.trim().toLowerCase()}@rafflesia.local`
}

function App() {
  // created: 2026-11-23T11:59:00-08:00
  const [mode, setMode] = useState<Mode>('signup')
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // created: 2026-11-23T11:59:00-08:00
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

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

      const email = toAuthEmail(cleanUser)

      if (mode === 'signup') {
        // created: 2026-11-23T19:55:00-08:00 — duplicate + ≥85% similarity vs existing usernames
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

  return (
    <div className="app-shell">
      <div className="glass-card">
        {user ? (
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
                <label>
                  Display name
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, DISPLAY_NAME_MAX))}
                    placeholder="What friends see"
                    autoComplete="nickname"
                    maxLength={DISPLAY_NAME_MAX}
                  />
                </label>
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
          </>
        )}
      </div>
    </div>
  )
}

export default App
