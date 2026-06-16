import { useState } from 'react'
import StatusPill from './StatusPill'
import { tokens } from './adminTheme'

const formatLabel = (key) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase())

const formatValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (value === undefined || value === null || value === '') return '—'
  return String(value)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function BookingCard({ booking, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)

  const { id, name, email, service, requested_date, requested_time, intake_data, notes, status } = booking

  const intakeEntries = Object.entries(intake_data || {}).filter(
    ([, v]) => formatValue(v) !== '—',
  )
  const hasDetails = intakeEntries.length > 0 || (notes && notes.trim())

  const handleAction = async (e, nextStatus) => {
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    try {
      await onUpdate(id, nextStatus)
    } finally {
      setBusy(false)
    }
  }

  const metaParts = [service, formatDate(requested_date), requested_time].filter(Boolean)

  return (
    <div
      onClick={() => hasDetails && setExpanded((v) => !v)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: hover ? tokens.shadowHover : tokens.shadow,
        padding: '20px 24px',
        cursor: hasDetails ? 'pointer' : 'default',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow .2s ease, transform .2s ease',
      }}
    >
      {/* Top line: name + meta — stacks on mobile, two columns on desktop */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <div
            className="truncate"
            style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em', color: tokens.ink }}
          >
            {name}
          </div>
          <div className="mt-[2px] truncate" style={{ fontSize: '14px', color: tokens.inkSoft }}>
            {email}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start sm:items-end sm:shrink-0">
          <div className="sm:text-right" style={{ fontSize: '14px', fontWeight: 500, color: tokens.ink }}>
            {metaParts.join(' · ')}
          </div>
          <StatusPill status={status} />
        </div>
      </div>

      {/* Expanded intake details */}
      {expanded && hasDetails && (
        <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${tokens.hairline}` }}>
          <div className="grid gap-x-8 gap-y-3" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
            {intakeEntries.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-6">
                <span
                  className="uppercase shrink-0"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}
                >
                  {formatLabel(key)}
                </span>
                <span className="text-right" style={{ fontSize: '14px', fontWeight: 500, color: tokens.ink }}>
                  {formatValue(value)}
                </span>
              </div>
            ))}
            {notes && notes.trim() && (
              <div className="flex items-start justify-between gap-6">
                <span
                  className="uppercase shrink-0"
                  style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}
                >
                  Notes
                </span>
                <span className="text-right" style={{ fontSize: '14px', fontWeight: 500, color: tokens.ink }}>
                  {notes}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center justify-end gap-2">
        {status !== 'confirmed' && (
          <button
            onClick={(e) => handleAction(e, 'confirmed')}
            disabled={busy}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: tokens.radiusControl,
              padding: '8px 14px',
              color: '#FFFFFF',
              background: tokens.ink,
              opacity: busy ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'filter .15s ease, opacity .15s ease',
            }}
            onMouseEnter={(e) => !busy && (e.currentTarget.style.filter = 'brightness(1.6)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            Confirm
          </button>
        )}
        {status !== 'cancelled' && (
          <button
            onClick={(e) => handleAction(e, 'cancelled')}
            disabled={busy}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: tokens.radiusControl,
              padding: '8px 14px',
              color: tokens.inkSoft,
              background: tokens.surface,
              border: `1px solid ${tokens.hairline}`,
              opacity: busy ? 0.5 : 1,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'background-color .15s ease, opacity .15s ease',
            }}
            onMouseEnter={(e) => !busy && (e.currentTarget.style.background = '#F7F7F9')}
            onMouseLeave={(e) => (e.currentTarget.style.background = tokens.surface)}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
