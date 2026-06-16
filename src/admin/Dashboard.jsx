import { useCallback, useEffect, useMemo, useState } from 'react'
import BookingCard from './BookingCard'
import AccountsTab from './AccountsTab'
import { brandName, tokens } from './adminTheme'

const TABS = [
  { key: 'bookings', label: 'Bookings' },
  { key: 'accounts', label: 'Accounts' },
]

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const SearchIcon = ({ size = 16, color = tokens.inkSoft }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

function Segmented({ value, onChange }) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 overflow-x-auto no-scrollbar"
      style={{ background: '#F2F2F4', borderRadius: tokens.radiusControl }}
    >
      {FILTERS.map((f) => {
        const active = value === f.key
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className="whitespace-nowrap"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: '7px',
              color: active ? tokens.accent : tokens.inkSoft,
              background: active ? tokens.surface : 'transparent',
              boxShadow: active ? '0 1px 2px rgba(0,0,0,.06)' : 'none',
              cursor: 'pointer',
              transition: 'color .15s ease, background-color .15s ease',
            }}
          >
            {f.label}
          </button>
        )
      })}
    </div>
  )
}

function StatCard({ label, value, accent, delay }) {
  return (
    <div
      className="admin-rise"
      style={{
        animationDelay: `${delay}ms`,
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: tokens.shadow,
        padding: '20px 24px',
      }}
    >
      <div
        className="uppercase"
        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: '8px',
          fontSize: '40px',
          lineHeight: 1,
          fontWeight: 600,
          letterSpacing: '-0.03em',
          fontVariantNumeric: 'tabular-nums',
          color: accent ? tokens.accent : tokens.ink,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SkeletonRow({ delay }) {
  return (
    <div
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: tokens.shadow,
        padding: '20px 24px',
      }}
    >
      <div className="admin-skeleton" style={{ animationDelay: `${delay}ms` }}>
        <div style={{ width: '38%', height: 14, borderRadius: 6, background: '#ECECEF' }} />
        <div style={{ width: '52%', height: 12, borderRadius: 6, background: '#F1F1F4', marginTop: 10 }} />
        <div style={{ width: '30%', height: 12, borderRadius: 6, background: '#F1F1F4', marginTop: 18, marginLeft: 'auto' }} />
      </div>
    </div>
  )
}

export default function Dashboard({ password }) {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('bookings')

  const loadBookings = useCallback(async () => {
    try {
      const res = await fetch('/.netlify/functions/admin-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (res.ok) {
        setBookings(data.bookings || [])
      } else {
        setLoadError(true)
      }
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => {
    loadBookings()
  }, [loadBookings])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const showToast = (message) => setToast({ message, id: Date.now() })

  const handleUpdate = async (id, status) => {
    const prev = bookings
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status } : b)))
    try {
      const res = await fetch('/.netlify/functions/admin-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, id, status }),
      })
      if (!res.ok) throw new Error('update failed')
      showToast(status === 'confirmed' ? 'Booking confirmed.' : 'Booking cancelled.')
    } catch {
      setBookings(prev)
      showToast('Could not save that. Try again.')
    }
  }

  const handlePaymentRecorded = (email) => {
    loadBookings()
    showToast(`Payment recorded. Receipt sent to ${email}.`)
  }

  const stats = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    return {
      total: bookings.length,
      pending: bookings.filter((b) => b.status === 'pending').length,
      thisWeek: bookings.filter((b) => new Date(b.created_at).getTime() >= weekAgo).length,
    }
  }, [bookings])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return bookings.filter((b) => {
      if (filter !== 'all' && b.status !== filter) return false
      if (!q) return true
      return (b.name || '').toLowerCase().includes(q) || (b.email || '').toLowerCase().includes(q)
    })
  }, [bookings, search, filter])

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })

  const searchInput = (mobile = false) => (
    <div
      className="flex items-center gap-2"
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusPill,
        padding: '8px 14px',
        width: mobile ? '100%' : 240,
      }}
    >
      <SearchIcon />
      <input
        value={search}
        autoFocus={mobile}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name or email"
        className="w-full bg-transparent outline-none"
        style={{ fontSize: '14px', color: tokens.ink }}
      />
    </div>
  )

  return (
    <div style={{ background: tokens.canvas, color: tokens.ink, fontFamily: tokens.font, minHeight: '100vh' }}>
      {/* Frosted sticky command bar — the signature element */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${tokens.hairline}`,
        }}
      >
        <div className="mx-auto" style={{ maxWidth: 1080, padding: '0 20px' }}>
          <div className="flex items-center justify-between gap-4" style={{ height: 64 }}>
            <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em' }}>
              {brandName}
            </span>

            {/* Desktop controls — bookings tab only */}
            {activeTab === 'bookings' && (
              <div className="hidden sm:flex items-center gap-3">
                {searchInput(false)}
                <Segmented value={filter} onChange={setFilter} />
              </div>
            )}

            {/* Mobile search toggle — bookings tab only */}
            {activeTab === 'bookings' && (
              <button
                className="sm:hidden flex items-center justify-center"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: tokens.radiusControl,
                  border: `1px solid ${tokens.hairline}`,
                  background: searchOpen ? '#F2F2F4' : tokens.surface,
                }}
              >
                <SearchIcon />
              </button>
            )}
          </div>

          {/* Mobile expanding search */}
          {activeTab === 'bookings' && searchOpen && (
            <div className="sm:hidden pb-3">{searchInput(true)}</div>
          )}

          {/* Mobile segmented filter row */}
          {activeTab === 'bookings' && (
            <div className="sm:hidden pb-3">
              <Segmented value={filter} onChange={setFilter} />
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto" style={{ maxWidth: 1080, padding: '0 20px 64px' }}>
        {/* Tab navigation — sits below the frosted command bar */}
        <div className="flex items-center gap-6" style={{ paddingTop: 24, borderBottom: `1px solid ${tokens.hairline}` }}>
          {TABS.map((t) => {
            const active = activeTab === t.key
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  color: active ? tokens.accent : tokens.inkSoft,
                  paddingBottom: 12,
                  marginBottom: -1,
                  borderBottom: `2px solid ${active ? tokens.accent : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'color .15s ease, border-color .15s ease',
                }}
              >
                {t.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'bookings' ? (
          <>
            {/* Eyebrow + date */}
        <div className="flex items-end justify-between" style={{ paddingTop: 32, paddingBottom: 20 }}>
          <span
            className="uppercase"
            style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}
          >
            Bookings
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
            {today}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 32 }}>
          <StatCard label="Total" value={stats.total} delay={0} />
          <StatCard label="Pending" value={stats.pending} accent delay={40} />
          <StatCard label="This Week" value={stats.thisWeek} delay={80} />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonRow key={i} delay={i * 120} />
            ))}
          </div>
        ) : loadError ? (
          <div style={{ padding: '64px 0', textAlign: 'center', color: tokens.inkSoft, fontSize: 15 }}>
            We couldn't load bookings just now. Refresh to try again.
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '72px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
              {bookings.length === 0 ? 'No bookings yet.' : 'No matches.'}
            </div>
            <p style={{ marginTop: 8, fontSize: 14, color: tokens.inkSoft }}>
              {bookings.length === 0
                ? 'New booking requests will appear here the moment someone submits the form.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((b, i) => (
              <div key={b.id} className="admin-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <BookingCard booking={b} onUpdate={handleUpdate} />
              </div>
            ))}
          </div>
        )}
          </>
        ) : (
          <AccountsTab
            bookings={bookings}
            password={password}
            onPaymentRecorded={handlePaymentRecorded}
          />
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className="fixed left-1/2 admin-rise"
          style={{
            bottom: 28,
            transform: 'translateX(-50%)',
            background: tokens.ink,
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: 500,
            padding: '11px 18px',
            borderRadius: tokens.radiusControl,
            boxShadow: tokens.shadowHover,
            zIndex: 50,
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
