// src/App.tsx
import { NavLink, Route, Routes } from 'react-router-dom'
import Home from './pages/Home.tsx'
import Upload from './pages/Upload.tsx'
import Confirm from './pages/Confirm.tsx'
import Log from './pages/Log.tsx'
import Settings from './pages/Settings.tsx'
import { useEffect } from 'react'

export default function App() {
  // Apply saved theme (or leave system default)
  useEffect(() => {
    const saved = localStorage.getItem('theme-pref') // 'light' | 'dark' | null
    if (saved === 'light' || saved === 'dark') {
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      document.documentElement.removeAttribute('data-theme') // use system
    }
  }, [])

  return (
    <div className="app">
      <header>
        <strong>Meal Tap</strong>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/log" element={<Log />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      <nav className="bottom">
        <div className="tabs">
          <Tab to="/" label="Home" />
          <Tab to="/upload" label="Upload" />
          <Tab to="/log" label="Log" />
          <Tab to="/settings" label="Settings" />
        </div>
      </nav>
    </div>
  )
}

function Tab({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }: { isActive: boolean }) => `tab${isActive ? ' active' : ''}`}
    >
      {label}
    </NavLink>
  )
}