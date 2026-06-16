import { useMemo, useState } from 'react'
import AccountsSummary from './AccountsSummary'
import PaymentRow from './PaymentRow'
import { tokens } from './adminTheme'

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'outstanding', label: 'Outstanding' },
]

function Segmented({ value, onChange }) {
  return (
    <div
      className="inline-flex items-center gap-1 p-1 overflow-x-auto no-scrollbar"
      style={{ background: '#F2F2F4', borderRadius: tokens.radiusControl }}
    >
      {STATUS_FILTERS.map((f) => {
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

function DateField({ label, value, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span
        className="uppercase"
        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}
      >
        {label}
      </span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: tokens.surface,
          border: `1px solid ${tokens.hairline}`,
          borderRadius: tokens.radiusControl,
          padding: '8px 12px',
          fontSize: '14px',
          color: tokens.ink,
          outline: 'none',
          fontFamily: tokens.font,
        }}
      />
    </label>
  )
}

export default function AccountsTab({ bookings, password, onPaymentRecorded }) {
  const [status, setStatus] = useState('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (status === 'paid' && b.payment_status !== 'paid') return false
      if (status === 'outstanding' && b.payment_status === 'paid') return false
      const d = b.requested_date
      if (from && (!d || d < from)) return false
      if (to && (!d || d > to)) return false
      return true
    })
  }, [bookings, status, from, to])

  return (
    <div>
      {/* Summary reflects all bookings, not the filters below it. */}
      <AccountsSummary bookings={bookings} />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between" style={{ marginBottom: 20 }}>
        <div className="flex items-end gap-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
        </div>
        <Segmented value={status} onChange={setStatus} />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div style={{ padding: '72px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>
            No bookings match these filters.
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((b, i) => (
            <div key={b.id} className="admin-rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <PaymentRow booking={b} password={password} onPaymentRecorded={onPaymentRecorded} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
