// src/theme.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'
type Ctx = { theme: Theme; toggle: () => void }
const ThemeCtx = createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem('mt_theme') as Theme | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('mt_theme', theme)
  }, [theme])

  const value = useMemo<Ctx>(() => ({
    theme,
    toggle: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
  }), [theme])

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeCtx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}