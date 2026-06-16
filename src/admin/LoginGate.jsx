import { useState } from 'react'
import { brandName, accent, accentWash } from './adminTheme'

export default function LoginGate({ onAuthenticated }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!password || submitting) return

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/.netlify/functions/admin-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (res.status === 200) {
        sessionStorage.setItem('admin_pw', password)
        onAuthenticated(password)
        return
      }

      if (res.status === 401) {
        setError("That password didn't match.")
      } else {
        setError('Something went wrong. Try again.')
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#FBFBFD', color: '#1D1D1F', fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      <div
        className="w-full max-w-[380px] rounded-[14px] px-8 py-9"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid #E8E8ED',
          boxShadow: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)',
        }}
      >
        <div
          className="text-[11px] uppercase"
          style={{ letterSpacing: '0.06em', fontWeight: 500, color: '#6E6E73' }}
        >
          Owner Dashboard
        </div>
        <h1
          className="mt-2 text-[28px]"
          style={{ fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          {brandName}
        </h1>
        <p className="mt-3 text-[14px]" style={{ color: '#6E6E73' }}>
          Enter your password to manage bookings.
        </p>

        <form onSubmit={handleSubmit} className="mt-7">
          <input
            type="password"
            value={password}
            autoFocus
            onChange={(e) => {
              setPassword(e.target.value)
              if (error) setError('')
            }}
            placeholder="Password"
            className="w-full text-[15px] rounded-[10px] px-4 py-3 outline-none"
            style={{
              background: '#FFFFFF',
              border: `1px solid ${error ? '#C2410C' : '#E8E8ED'}`,
              color: '#1D1D1F',
              transition: 'border-color .15s ease, box-shadow .15s ease',
            }}
            onFocus={(e) => {
              if (error) return
              e.target.style.borderColor = accent
              e.target.style.boxShadow = `0 0 0 3px ${accentWash(accent, 0.15)}`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = error ? '#C2410C' : '#E8E8ED'
              e.target.style.boxShadow = 'none'
            }}
          />

          {error && (
            <p className="mt-2 text-[13px]" style={{ color: '#C2410C' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !password}
            className="mt-5 w-full text-[15px] rounded-[10px] px-4 py-3 text-white"
            style={{
              background: accent,
              fontWeight: 500,
              opacity: submitting || !password ? 0.5 : 1,
              cursor: submitting || !password ? 'not-allowed' : 'pointer',
              transition: 'filter .15s ease, opacity .15s ease',
            }}
            onMouseEnter={(e) => {
              if (!submitting && password) e.currentTarget.style.filter = 'brightness(0.95)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none'
            }}
          >
            {submitting ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
