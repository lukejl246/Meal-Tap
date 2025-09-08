// src/pages/Confirm.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.ts'

export default function Confirm() {
  const [state, setState] = useState('checking…')
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setState('no session')
      return
    }
    let unsub: (() => void) | undefined
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setEmail(data.session.user.email ?? null)
        setState('signed in')
      } else {
        setState('no session')
      }
      const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
        setEmail(session?.user?.email ?? null)
        setState(session ? 'signed in' : 'no session')
      })
      unsub = () => sub.subscription.unsubscribe()
    })()
    return () => { unsub?.() }
  }, [])

  return (
    <section>
      <h2>Confirm</h2>
      {state === 'signed in' ? (
        <p>✅ Signed in{email ? ` as ${email}` : ''}. You can now go to <a href="/upload">Upload</a> or <a href="/log">Log</a>.</p>
      ) : (
        <p>Waiting for session… If you opened a magic link, it should say signed in here.</p>
      )}
    </section>
  )
}