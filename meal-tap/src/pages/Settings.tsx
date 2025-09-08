// src/pages/Settings.tsx
import { supabase } from '../lib/supabaseClient.ts'
import { useEffect, useState } from 'react'

type ThemePref = 'system' | 'light' | 'dark'

export default function Settings() {
  const [pref, setPref] = useState<ThemePref>('system')
  const [signingOut, setSigningOut] = useState(false)

  // Load theme pref from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme-pref') as ThemePref | null
    if (saved === 'light' || saved === 'dark') setPref(saved)
    else setPref('system')
  }, [])

  // Apply on change
  useEffect(() => {
    if (pref === 'light' || pref === 'dark') {
      document.documentElement.setAttribute('data-theme', pref)
      localStorage.setItem('theme-pref', pref)
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.removeItem('theme-pref')
    }
  }, [pref])

  async function signOut() {
    if (!supabase) return
    setSigningOut(true)
    await supabase.auth.signOut()
    setSigningOut(false)
    // UI will reflect signed-out status automatically on Home/Confirm
  }

  return (
    <section>
      <h2>Settings</h2>

      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <strong>Theme</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          <label><input type="radio" checked={pref==='system'} onChange={() => setPref('system')} /> System</label>
          <label><input type="radio" checked={pref==='light'} onChange={() => setPref('light')} /> Light</label>
          <label><input type="radio" checked={pref==='dark'} onChange={() => setPref('dark')} /> Dark</label>
        </div>
        <small className="muted">System follows your OS setting. Light/Dark forces a theme.</small>
      </div>

      <div style={{ height: 12 }} />

      <div className="card" style={{ display: 'grid', gap: 8 }}>
        <strong>Account</strong>
        <button onClick={signOut} disabled={signingOut}>
          {signingOut ? 'Signing out…' : 'Sign out'}
        </button>
        <small className="muted">Sign-out clears your session; the app will show “signed out”.</small>
      </div>
    </section>
  )
}