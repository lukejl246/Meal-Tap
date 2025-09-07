import { useEffect, useRef, useState } from 'react'
import { supabase } from './lib/supabaseClient' // adjust if your file name differs

export default function App() {
  const [ok, setOk] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // --- Step 5 state (DB RLS) ---
  const [mealCount, setMealCount] = useState<number | null>(null)
  const [lastMealId, setLastMealId] = useState<string | null>(null)
  const [dbErr, setDbErr] = useState<string | null>(null)

  // --- Step 6 state (Storage RLS) ---
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [uploadPath, setUploadPath] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)

  // Track client + auth session
  useEffect(() => {
    setOk(!!supabase)

    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setUserId(session?.user?.id ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ---------- STEP 5: DB RLS smoke test (run once per page load) ----------
  const ranOnceRef = useRef(false)
  useEffect(() => {
    if (!userId) return
    if (ranOnceRef.current) return
    ranOnceRef.current = true

    ;(async () => {
      setDbErr(null)

      // 1) Upsert defaults (only allowed for me)
      const { error: defErr } = await supabase.from('user_defaults').upsert({
        user_id: userId,
        timezone: 'Europe/London',
        unit_system: 'metric',
        daily_calorie_target: 2300,
      })
      if (defErr) { setDbErr(defErr.message); console.error(defErr); return }

      // 2) Insert a meal (belongs to me)
      const { data: inserted, error: insErr } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          label: 'breakfast',
          notes: 'oats + banana (RLS test)',
          calories: 410, protein_g: 15, carbs_g: 70, fat_g: 9,
          source: 'manual',
        })
        .select('id')
        .single()

      if (insErr) { setDbErr(insErr.message); console.error(insErr); return }
      setLastMealId(inserted?.id ?? null)

      // 3) Read back my meals count (RLS should only count mine)
      const { count, error: cntErr } = await supabase
        .from('meals')
        .select('id', { count: 'exact', head: true })
      if (cntErr) { setDbErr(cntErr.message); console.error(cntErr); return }
      setMealCount(count ?? 0)
    })()
  }, [userId])

  // ---------- STEP 6: Storage RLS smoke test ----------
  async function uploadTestImage() {
    try {
      setUploading(true)
      setUploadErr(null)
      setUploadPath(null)
      setSignedUrl(null)

      if (!userId) throw new Error('No user session (are you signed in?)')

      // A tiny valid 1x1 transparent PNG (base64) -> Blob
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
      const file = await (await fetch(dataUrl)).blob()

      // Store as: <userId>/<random>.png
      const path = `${userId}/${crypto.randomUUID()}.png`

      // Upload into the private bucket
      const { error: upErr } = await supabase
        .storage
        .from('meal-photos')
        .upload(path, file, { upsert: false, contentType: 'image/png' })

      if (upErr) throw upErr
      setUploadPath(path)

      // Create a short-lived signed URL (60s)
      const { data: signed, error: signErr } = await supabase
        .storage
        .from('meal-photos')
        .createSignedUrl(path, 60)

      if (signErr) throw signErr
      setSignedUrl(signed?.signedUrl ?? null)

      // (optional) Save path onto the last inserted meal
      if (lastMealId) {
        const { error: updErr } = await supabase
          .from('meals')
          .update({ photo_path: path })
          .eq('id', lastMealId)
        if (updErr) throw updErr
      }
    } catch (e: any) {
      console.error('uploadTestImage error:', e)
      setUploadErr(e?.message ?? String(e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Meal Tap</h1>

      <p>Vite + React + TS + Supabase client: <strong>{ok ? 'OK' : '…'}</strong></p>
      <p>Auth: <strong>{userId ? `signed in (${userId.slice(0, 8)}…)` : 'no session'}</strong></p>

      <hr style={{ margin: '16px 0', opacity: 0.2 }} />

      <h3>Step 5 — DB RLS Smoke Test</h3>
      <p>My meals (RLS): <strong>{mealCount ?? '…'}</strong></p>
      <p>Last inserted meal id: <strong>{lastMealId ? `${lastMealId.slice(0, 8)}…` : '…'}</strong></p>
      {dbErr && <p style={{ color: 'crimson' }}>DB Error: {dbErr}</p>}

      <hr style={{ margin: '16px 0', opacity: 0.2 }} />

      <h3>Step 6 — Storage RLS Smoke Test</h3>
      <button onClick={uploadTestImage} disabled={!userId || uploading} style={{ padding: 8 }}>
        {uploading ? 'Uploading…' : 'Upload 1×1 PNG & Create Signed URL'}
      </button>

      <div style={{ marginTop: 12 }}>
        <p>Uploaded path: <code>{uploadPath ?? '—'}</code></p>
        <p>Signed URL (60s): {signedUrl ? <a href={signedUrl} target="_blank">open</a> : '—'}</p>
        {signedUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={signedUrl} alt="test" style={{ maxWidth: 160, borderRadius: 8 }} />
          </div>
        )}
        {uploadErr && <p style={{ color: 'crimson' }}>Storage Error: {uploadErr}</p>}
      </div>

      <p style={{ marginTop: 24 }}>
        Timezone: Europe/London (we’ll apply this in later phases).
      </p>
    </main>
  )
}