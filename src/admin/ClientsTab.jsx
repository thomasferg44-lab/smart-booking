import { useEffect, useMemo, useState } from 'react'
import { tokens } from './adminTheme'
import { formatKyd, formatUsd } from './payments'
import ClientDetail from './ClientDetail'

const relativeDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const w = Math.floor(days / 7)
    return `${w} week${w > 1 ? 's' : ''} ago`
  }
  if (days < 365) {
    const m = Math.floor(days / 30)
    return `${m} month${m > 1 ? 's' : ''} ago`
  }
  const y = Math.floor(days / 365)
  return `${y} year${y > 1 ? 's' : ''} ago`
}

const SearchIcon = ({ size = 16, color = tokens.inkSoft }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const Chevron = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tokens.inkSoft} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
    <path d="M9 18l6-6-6-6" />
  </svg>
)

function SummaryCard({ label, primary, secondary, accent }) {
  return (
    <div
      className="admin-rise accounts-summary-card"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: tokens.shadow,
      }}
    >
      <div className="uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}>
        {label}
      </div>
      <div
        className="accounts-summary-value"
        style={{
          marginTop: '8px',
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          color: accent ? tokens.accent : tokens.ink,
        }}
      >
        {primary}
      </div>
      {secondary && (
        <div style={{ marginTop: '4px', fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: tokens.inkSoft }}>
          {secondary}
        </div>
      )}
    </div>
  )
}

function Tag({ children }) {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: '999px',
        background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
        color: 'var(--color-primary)',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function ClientRow({ client, onSelect }) {
  const [hover, setHover] = useState(false)
  const tags = client.tags || []

  return (
    <button
      type="button"
      onClick={() => onSelect(client)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full text-left flex items-center gap-4"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: hover ? tokens.shadowHover : tokens.shadow,
        padding: '16px 20px',
        cursor: 'pointer',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow .2s ease, transform .2s ease',
      }}
    >
      {/* Left: identity + meta */}
      <div className="min-w-0 flex-1">
        <div className="truncate" style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em', color: tokens.ink }}>
          {client.name || client.email}
        </div>
        <div className="truncate" style={{ fontSize: '14px', color: tokens.inkSoft }}>
          {client.email}
        </div>
        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 8 }}>
          <span
            style={{
              fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '999px',
              background: '#F2F2F4', color: tokens.inkSoft, whiteSpace: 'nowrap',
            }}
          >
            {client.totalBookings} booking{client.totalBookings === 1 ? '' : 's'}
          </span>
          {tags.slice(0, 3).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
          {tags.length > 3 && (
            <span style={{ fontSize: '11px', color: tokens.inkSoft }}>+{tags.length - 3} more</span>
          )}
        </div>
      </div>

      {/* Right: money + recency */}
      <div className="text-right shrink-0">
        <div style={{ fontSize: '15px', fontWeight: 600, color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>
          {formatKyd(client.lifetimeValue)}
        </div>
        {client.outstanding > 0 && (
          <div style={{ fontSize: '13px', fontWeight: 600, color: tokens.accent, fontVariantNumeric: 'tabular-nums' }}>
            {formatKyd(client.outstanding)} due
          </div>
        )}
        <div style={{ fontSize: '12px', color: tokens.inkSoft, marginTop: 2 }}>{relativeDate(client.lastBooking)}</div>
      </div>

      <Chevron />
    </button>
  )
}

export default function ClientsTab({ password }) {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/.netlify/functions/admin-clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const data = await res.json()
        if (cancelled) return
        if (res.ok) setClients(data.clients || [])
        else setError(true)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [password])

  const totals = useMemo(
    () => ({
      count: clients.length,
      lifetime: clients.reduce((s, c) => s + Number(c.lifetimeValue || 0), 0),
      outstanding: clients.reduce((s, c) => s + Number(c.outstanding || 0), 0),
    }),
    [clients],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(
      (c) => (c.name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q),
    )
  }, [clients, search])

  if (selectedClient) {
    return (
      <ClientDetail
        client={selectedClient}
        password={password}
        onBack={() => setSelectedClient(null)}
        onSaved={(email, payload) =>
          setClients((list) => list.map((c) => (c.email === email ? { ...c, ...payload } : c)))
        }
      />
    )
  }

  return (
    <div>
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 20 }}>
        <SummaryCard label="Clients" primary={totals.count} />
        <SummaryCard label="Lifetime Value" primary={formatKyd(totals.lifetime)} secondary={formatUsd(totals.lifetime)} />
        <SummaryCard label="Outstanding" primary={formatKyd(totals.outstanding)} secondary={formatUsd(totals.outstanding)} accent />
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2"
        style={{
          background: tokens.surface,
          border: `1px solid ${tokens.hairline}`,
          borderRadius: tokens.radiusPill,
          padding: '8px 14px',
          marginBottom: 20,
        }}
      >
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients by name or email"
          className="w-full bg-transparent outline-none"
          style={{ fontSize: '14px', color: tokens.ink }}
        />
      </div>

      {/* List / states */}
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: tokens.radiusCard, boxShadow: tokens.shadow, padding: '16px 20px' }}
            >
              <div className="admin-skeleton" style={{ animationDelay: `${i * 120}ms` }}>
                <div style={{ width: '40%', height: 14, borderRadius: 6, background: '#ECECEF' }} />
                <div style={{ width: '55%', height: 12, borderRadius: 6, background: '#F1F1F4', marginTop: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '64px 0', textAlign: 'center', color: tokens.inkSoft, fontSize: 15 }}>
          We couldn't load clients just now. Refresh to try again.
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
            {clients.length === 0 ? 'No bookings yet.' : 'No matches.'}
          </div>
          <p style={{ marginTop: 8, fontSize: 14, color: tokens.inkSoft }}>
            {clients.length === 0
              ? 'Clients will appear here automatically once bookings come in.'
              : 'Try a different search.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((c, i) => (
            <div key={c.email} className="admin-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <ClientRow client={c} onSelect={setSelectedClient} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
