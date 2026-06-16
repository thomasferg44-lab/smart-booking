import { useState } from 'react'
import { createPortal } from 'react-dom'
import { tokens } from './adminTheme'
import { formatMoney, PAYMENT_METHODS } from './payments'

const today = () => new Date().toISOString().split('T')[0]

export default function PayModal({ booking, password, onClose, onSuccess }) {
  const [paymentDate, setPaymentDate] = useState(today())
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleConfirm = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/admin-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, bookingId: booking.id, paymentDate, paymentMethod }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not record payment. Try again.')
      }
      onSuccess(booking.email)
    } catch (err) {
      setError(err.message || 'Could not record payment. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    color: tokens.inkSoft,
    textTransform: 'uppercase',
    display: 'block',
    marginBottom: 6,
  }

  const fieldStyle = {
    width: '100%',
    background: tokens.surface,
    border: `1px solid ${tokens.hairline}`,
    borderRadius: tokens.radiusControl,
    padding: '9px 12px',
    fontSize: '14px',
    color: tokens.ink,
    outline: 'none',
    fontFamily: tokens.font,
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => !loading && onClose()}
      style={{
        background: 'rgba(29,29,31,0.4)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: 20,
      }}
    >
      <div
        className="admin-rise"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: tokens.surface,
          border: `1px solid ${tokens.hairline}`,
          borderRadius: tokens.radiusCard,
          boxShadow: tokens.shadowHover,
          padding: 24,
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em', color: tokens.ink }}>
          Record payment
        </div>

        {/* Booking summary */}
        <div
          style={{
            marginTop: 16,
            padding: '14px 16px',
            background: tokens.canvas,
            border: `1px solid ${tokens.hairline}`,
            borderRadius: tokens.radiusControl,
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, color: tokens.ink }}>{booking.name}</div>
          <div style={{ marginTop: 2, fontSize: '13px', color: tokens.inkSoft }}>{booking.service}</div>
          <div
            style={{
              marginTop: 8,
              fontSize: '14px',
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
              color: tokens.ink,
            }}
          >
            {formatMoney(booking.price_kyd)}
          </div>
        </div>

        {/* Inputs */}
        <div style={{ marginTop: 20 }}>
          <label style={labelStyle} htmlFor="pay-date">Date received</label>
          <input
            id="pay-date"
            type="date"
            value={paymentDate}
            max={today()}
            onChange={(e) => setPaymentDate(e.target.value)}
            style={fieldStyle}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle} htmlFor="pay-method">Payment method</label>
          <select
            id="pay-method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            style={fieldStyle}
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: tokens.radiusControl,
              background: '#FDECEC',
              color: '#B42318',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2" style={{ marginTop: 24 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: tokens.radiusControl,
              padding: '9px 16px',
              color: tokens.inkSoft,
              background: tokens.surface,
              border: `1px solid ${tokens.hairline}`,
              opacity: loading ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              fontSize: '13px',
              fontWeight: 500,
              borderRadius: tokens.radiusControl,
              padding: '9px 16px',
              color: '#FFFFFF',
              background: tokens.accent,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'filter .15s ease, opacity .15s ease',
            }}
          >
            {loading ? 'Saving…' : 'Confirm payment'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
