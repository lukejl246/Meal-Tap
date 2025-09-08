// src/pages/Home.tsx
import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient.ts'

const SITE_URL = import.meta.env.VITE_SITE_URL ?? (window.location.origin + '/confirm')
// Tip: if you want the confirm page, set VITE_SITE_URL to http://localhost:5173/confirm

export default function Home() {
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState('checking session…')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setStatus('signed out')
      return
    }
    let unsub: (() => void) | undefined
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      setSession(data.session ?? null)
      setStatus(data.session ? 'signed in' : 'signed out')
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
        setSession(newSession)
        setStatus(newSession ? 'signed in' : 'signed out')
        setError(null)
      })
      unsub = () => sub.subscription.unsubscribe()
    })()
    return () => { unsub?.() }
  }, [])

  async function sendMagicLink() {
    if (!supabase) {
      setError('Supabase not configured')
      return
    }
    try {
      setError(null); setSending(true); setSentTo(null)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: SITE_URL },
      })
      if (error) throw error
      setSentTo(email); setEmail('')
    } catch (e: any) {
      setError(e?.message ?? String(e))
    } finally { setSending(false) }
  }

  return (
    <section>
      <h2>Home</h2>
      <p>Status: <strong>{status}</strong></p>

      {session ? (
        <div className="card">
          <p>
            Signed in as: <strong>{session.user.email ?? session.user.id}</strong>
          </p>
          <small className="muted">Use Settings → Sign out to end the session.</small>
        </div>
      ) : (
        <>
          <p>Magic link sign-in (passwordless):</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button onClick={sendMagicLink} disabled={!email || sending}>
              {sending ? 'Sending…' : 'Send link'}
            </button>
          </div>
          {sentTo && <p>✅ Link sent to <strong>{sentTo}</strong></p>}
          {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
        </>
      )}
    </section>
  )
}