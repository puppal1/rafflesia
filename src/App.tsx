// created: 2026-11-23T11:59:00-08:00
// updated: 2026-11-23T12:14:00-08:00 — local features first (auth + home app)
import { FormEvent, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { HomeApp } from './HomeApp'
import { supabase } from './lib/supabase'
import './App.css'

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

    const cleanUser = username.trim().toLowerCase()
    const cleanDisplay = displayName.trim() || cleanUser
    const email = toAuthEmail(cleanUser)

    try {
      if (!cleanUser || !password) {
        throw new Error('Please enter a username and password.')
      }
      if (cleanUser.includes(' ') || cleanUser.includes('@')) {
        throw new Error('Username cannot have spaces or @.')
      }

      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
        if (!data.user) throw new Error('Could not create account.')

        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username: cleanUser,
          display_name: cleanDisplay,
          bio: '',
        })
        if (profileError) throw profileError
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
            <img className="logo" src="/logo.jpg" alt="Rafflesia Online logo" />
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
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What friends see"
                    autoComplete="nickname"
                  />
                </label>
              )}
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  autoComplete="username"
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
