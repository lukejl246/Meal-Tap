// src/pages/Log.tsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient.ts'

type Meal = {
  id: string
  captured_at: string
  label: string | null
  calories: number | null
}

export default function Log() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      setMeals([])
      setLoading(false)
      return
    }
    let alive = true
    ;(async () => {
      setLoading(true); setError(null)
      const { data: userRes } = await supabase.auth.getUser()
      if (!userRes.user) {
        setMeals([]); setLoading(false); return
      }

      const { data, error } = await supabase
        .from('meals')
        .select('id, captured_at, label, calories')
        .order('captured_at', { ascending: false })
        .limit(20)

      if (!alive) return
      if (error) setError(error.message)
      setMeals(data ?? [])
      setLoading(false)
    })()
    return () => { alive = false }
  }, [])

  return (
    <section>
      <h2>Log</h2>
      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>Error: {error}</p>}
      {!loading && meals.length === 0 && <p className="card">No meals yet. Add one from Home (dev test) or via Upload next phase.</p>}

      <div style={{ display: 'grid', gap: 8 }}>
        {meals.map(m => (
          <div key={m.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{m.label ?? 'meal'}</strong>
              <span><small className="muted">{new Date(m.captured_at).toLocaleString()}</small></span>
            </div>
            <div><small className="muted">{m.calories ?? 0} kcal</small></div>
          </div>
        ))}
      </div>
    </section>
  )
}