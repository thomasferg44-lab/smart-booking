import { useState } from 'react'
import { createPortal } from 'react-dom'
import { tokens } from './adminTheme'

const today = () => new Date().toISOString().split('T')[0]

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

// Admin-only form for entering a booking manually (e.g. past bookings).
export default function AddBookingModal({ password, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [service, setService] = useState('')
  const [date, setDate] = useState(today())
  const [time, setTime] = useState('')
  const [priceKyd, setPriceKyd] = useState('')
  const [status, setStatus] = useState('confirmed')
  const [paymentStatus, setPaymentStatus] = useState('unpaid')
  const [paymentMethod, setPaymentMethod] = useState('other')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const valid = name.trim() && email.trim() && service.trim()

  const handleSubmit = async () => {
    if (!valid || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/admin-create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          name,
          email,
          phone,
          service,
          date: date || null,
          time,
          priceKyd: priceKyd === '' ? 0 : priceKyd,
          status,
          paymentStatus,
          paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not add booking.')
      onCreated(name.trim())
    } catch (err) {
      setError(err.message || 'Could not add booking.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={() => !loading && onClose()}
      style={{ background: 'rgba(29,29,31,0.4)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', padding: 20, overflowY: 'auto' }}
    >
      <div
        className="admin-rise"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 460,
          background: tokens.surface,
          border: `1px solid ${tokens.hairline}`,
          borderRadius: tokens.radiusCard,
          boxShadow: tokens.shadowHover,
          padding: 24,
          margin: 'auto',
        }}
      >
        <div style={{ fontSize: '17px', fontWeight: 600, letterSpacing: '-0.01em', color: tokens.ink }}>Add a booking</div>
        <p style={{ fontSize: '13px', color: tokens.inkSoft, marginTop: 4 }}>
          For entering past or phone bookings. This doesn’t email the client.
        </p>

        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle} htmlFor="ab-name">Client name *</label>
            <input id="ab-name" style={fieldStyle} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ab-email">Email *</label>
            <input id="ab-email" type="email" style={fieldStyle} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ab-phone">Phone</label>
            <input id="ab-phone" style={fieldStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle} htmlFor="ab-service">Service *</label>
            <input id="ab-service" style={fieldStyle} placeholder="e.g. Private lesson (1hr)" value={service} onChange={(e) => setService(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="ab-date">Date</label>
              <input id="ab-date" type="date" max={today()} style={fieldStyle} value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="ab-time">Time</label>
              <input id="ab-time" style={fieldStyle} placeholder="e.g. 9:00 AM" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="ab-price">Price (KYD)</label>
              <input id="ab-price" type="number" min="0" step="0.01" style={fieldStyle} value={priceKyd} onChange={(e) => setPriceKyd(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="ab-status">Status</label>
              <select id="ab-status" style={fieldStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <div style={{ flex: 1 }}>
              <label style={labelStyle} htmlFor="ab-pay">Payment</label>
              <select id="ab-pay" style={fieldStyle} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {paymentStatus === 'paid' && (
              <div style={{ flex: 1 }}>
                <label style={labelStyle} htmlFor="ab-method">Method</label>
                <select id="ab-method" style={fieldStyle} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="other">Other</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: tokens.radiusControl, background: '#FDECEC', color: '#B42318', fontSize: '13px' }}>
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2" style={{ marginTop: 24 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ fontSize: '13px', fontWeight: 500, borderRadius: tokens.radiusControl, padding: '9px 16px', color: tokens.inkSoft, background: tokens.surface, border: `1px solid ${tokens.hairline}`, cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!valid || loading}
            style={{ fontSize: '13px', fontWeight: 500, borderRadius: tokens.radiusControl, padding: '9px 16px', color: '#fff', background: tokens.accent, opacity: !valid || loading ? 0.5 : 1, cursor: !valid || loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Adding…' : 'Add booking'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
