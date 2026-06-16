import { useEffect, useState } from 'react'
import LoginGate from './LoginGate'
import Dashboard from './Dashboard'
import { brandName } from './adminTheme'

export default function AdminApp() {
  const [password, setPassword] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    document.title = `${brandName} — Dashboard`
  }, [])

  // On mount, try a password already stored in this tab's session.
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_pw')
    if (!stored) {
      setChecking(false)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/.netlify/functions/admin-bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: stored }),
        })
        if (!cancelled && res.status === 200) {
          setPassword(stored)
        } else if (!cancelled) {
          sessionStorage.removeItem('admin_pw')
        }
      } catch {
        if (!cancelled) sessionStorage.removeItem('admin_pw')
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  if (checking) {
    return (
      <div
        className="min-h-screen"
        style={{ background: '#FBFBFD', fontFamily: 'Inter, system-ui, sans-serif' }}
      />
    )
  }

  if (!password) {
    return <LoginGate onAuthenticated={setPassword} />
  }

  return <Dashboard password={password} />
}
