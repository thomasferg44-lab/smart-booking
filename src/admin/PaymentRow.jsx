import { useState } from 'react'
import StatusPill from './StatusPill'
import PayModal from './PayModal'
import { tokens } from './adminTheme'
import { formatKyd, formatUsd, methodLabel } from './payments'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function PaymentRow({ booking, password, onPaymentRecorded }) {
  const [showModal, setShowModal] = useState(false)
  const [hover, setHover] = useState(false)

  const { name, service, requested_date, price_kyd, payment_status, payment_date, payment_method } = booking
  const paid = payment_status === 'paid'
  const metaParts = [service, formatDate(requested_date)].filter(Boolean)

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: hover ? tokens.shadowHover : tokens.shadow,
        padding: '20px 24px',
        transform: hover ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow .2s ease, transform .2s ease',
      }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        {/* Left: client + service · date */}
        <div className="min-w-0">
          <div
            className="truncate"
            style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.01em', color: tokens.ink }}
          >
            {name}
          </div>
          <div className="mt-[2px] truncate" style={{ fontSize: '14px', color: tokens.inkSoft }}>
            {metaParts.join(' · ')}
          </div>
        </div>

        {/* Right: price + status pill */}
        <div className="flex flex-col gap-2 items-start sm:items-end sm:shrink-0">
          <div
            className="sm:text-right"
            style={{ fontSize: '15px', fontWeight: 600, color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatKyd(price_kyd)}
          </div>
          <div
            className="sm:text-right"
            style={{ fontSize: '13px', color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}
          >
            {formatUsd(price_kyd)}
          </div>
          <StatusPill status={paid ? 'paid' : 'unpaid'} />
        </div>
      </div>

      {/* Footer: paid details or the action */}
      <div className="mt-4 flex items-center justify-end gap-2">
        {paid ? (
          <span style={{ fontSize: '13px', color: tokens.inkSoft, fontVariantNumeric: 'tabular-nums' }}>
            Paid {formatDate(payment_date)} · {methodLabel(payment_method)}
          </span>
        ) : (
          <button
            onClick={() => setShowModal(true)}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: tokens.radiusControl,
              padding: '8px 14px',
              color: '#FFFFFF',
              background: tokens.accent,
              cursor: 'pointer',
              transition: 'filter .15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(0.92)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            Mark as Paid
          </button>
        )}
      </div>

      {showModal && (
        <PayModal
          booking={booking}
          password={password}
          onClose={() => setShowModal(false)}
          onSuccess={(email) => {
            setShowModal(false)
            onPaymentRecorded(email)
          }}
        />
      )}
    </div>
  )
}
