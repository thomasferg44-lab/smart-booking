import { useEffect, useRef, useState } from 'react'
import StatusPill from './StatusPill'
import { tokens } from './adminTheme'
import { formatKyd, formatUsd } from './payments'
import { weekLabels, locationLabel } from '../bookingEngine'

const MAX_NOTES = 2000
const MAX_TAGS = 10
const MAX_TAG_LEN = 30

const fmtDate = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}
const fmtMonth = (iso) => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
}

function StatCard({ label, primary, secondary, accent }) {
  return (
    <div
      className="accounts-summary-card"
      style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: tokens.radiusCard, boxShadow: tokens.shadow }}
    >
      <div className="uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}>
        {label}
      </div>
      <div
        className="accounts-summary-value"
        style={{ marginTop: 8, lineHeight: 1.1, fontWeight: 600, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: accent ? tokens.accent : tokens.ink }}
      >
        {primary}
      </div>
      {secondary && (
        <div style={{ marginTop: 4, fontSize: '13px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', color: tokens.inkSoft }}>
          {secondary}
        </div>
      )}
    </div>
  )
}

function HistoryRow({ b }) {
  const title = [b.category_label || b.service, b.option_name].filter(Boolean).join(' · ') || '—'
  const dateStr = b.requested_date ? fmtDate(b.requested_date) : fmtDate(b.created_at)
  const weeks =
    Array.isArray(b.selected_weeks) && b.selected_weeks.length
      ? weekLabels(b.category_id, b.selected_weeks).join(', ')
      : null

  return (
    <div
      style={{ background: tokens.surface, border: `1px solid ${tokens.hairline}`, borderRadius: tokens.radiusCard, boxShadow: tokens.shadow, padding: '14px 18px' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate" style={{ fontSize: '14px', fontWeight: 600, color: tokens.ink }}>
            {title}
            {b.lesson_quantity > 1 ? ` × ${b.lesson_quantity}` : ''}
            {b.calendar_event_id ? <span title="On the calendar"> 📅</span> : ''}
          </div>
          <div style={{ fontSize: '13px', color: tokens.inkSoft, marginTop: 2 }}>
            {dateStr}
            {b.time_slot ? ` · ${b.time_slot}` : ''}
          </div>
          {weeks && <div style={{ fontSize: '13px', color: tokens.inkSoft, marginTop: 2 }}>Weeks: {weeks}</div>}
          {b.level && <div style={{ fontSize: '13px', color: tokens.inkSoft, marginTop: 2 }}>Level: {b.level}</div>}
          {b.lesson_location && (
            <div style={{ fontSize: '13px', color: tokens.inkSoft, marginTop: 2 }}>Location: {locationLabel(b.lesson_location)}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div style={{ fontSize: '14px', fontWeight: 600, color: tokens.ink, fontVariantNumeric: 'tabular-nums' }}>
            {formatKyd(b.price_kyd)}
          </div>
          <div className="flex items-center gap-1">
            <StatusPill status={b.status} />
            <StatusPill status={b.payment_status} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ClientDetail({ client, password, onBack, onSaved }) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const [notes, setNotes] = useState(client.notes || '')
  const savedNotes = useRef(client.notes || '')
  const [tags, setTags] = useState(client.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [saveState, setSaveState] = useState('idle') // idle | saving | saved | error

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/.netlify/functions/admin-clients?email=${encodeURIComponent(client.email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })
        const data = await res.json()
        if (cancelled) return
        if (res.ok) setHistory(data.history || [])
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
  }, [client.email, password])

  // Non-blocking save of a single field (notes OR tags) — they're independent.
  const save = async (payload) => {
    setSaveState('saving')
    try {
      const res = await fetch('/.netlify/functions/admin-client-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, email: client.email, ...payload }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'save failed')
      setSaveState('saved')
      onSaved?.(client.email, payload)
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000)
    } catch {
      setSaveState('error')
    }
  }

  const handleNotesBlur = () => {
    if (notes === savedNotes.current) return
    savedNotes.current = notes
    save({ notes })
  }

  const addTag = (raw) => {
    const t = raw.trim()
    if (!t) return
    if (t.length > MAX_TAG_LEN) return
    if (tags.includes(t) || tags.length >= MAX_TAGS) {
      setTagInput('')
      return
    }
    const next = [...tags, t]
    setTags(next)
    setTagInput('')
    save({ tags: next })
  }

  const removeTag = (t) => {
    const next = tags.filter((x) => x !== t)
    setTags(next)
    save({ tags: next })
  }

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(tagInput)
    }
  }

  const saveLabel =
    saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? "Couldn't save" : ''

  return (
    <div>
      {/* Header */}
      <button
        type="button"
        onClick={onBack}
        style={{ fontSize: '13px', fontWeight: 500, color: tokens.accent, background: 'none', cursor: 'pointer', padding: '4px 0' }}
      >
        ← Back to clients
      </button>

      <div style={{ marginTop: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '-0.02em', color: tokens.ink }}>
          {client.name || client.email}
        </h2>
        <div style={{ fontSize: '14px', color: tokens.inkSoft, marginTop: 2 }}>
          {client.email}
          {client.phone ? ` · ${client.phone}` : ''}
        </div>
        <div style={{ fontSize: '13px', color: tokens.inkSoft, marginTop: 4 }}>
          First seen {fmtDate(client.firstBooking)} · Last seen {fmtDate(client.lastBooking)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 28 }}>
        <StatCard label="Total Bookings" primary={client.totalBookings} />
        <StatCard label="Lifetime Value" primary={formatKyd(client.lifetimeValue)} secondary={formatUsd(client.lifetimeValue)} />
        <StatCard label="Outstanding" primary={formatKyd(client.outstanding)} secondary={formatUsd(client.outstanding)} accent={client.outstanding > 0} />
        <StatCard label="Member Since" primary={fmtMonth(client.firstBooking)} />
      </div>

      {/* Booking history */}
      <div className="uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft, marginBottom: 12 }}>
        Booking history
      </div>
      {loading ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: tokens.inkSoft, fontSize: 14 }}>Loading…</div>
      ) : error ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: tokens.inkSoft, fontSize: 14 }}>
          Couldn't load booking history.
        </div>
      ) : history.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: tokens.inkSoft, fontSize: 14 }}>No bookings yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {history.map((b) => (
            <HistoryRow key={b.id} b={b} />
          ))}
        </div>
      )}

      {/* Owner notes */}
      <div className="flex items-center justify-between" style={{ marginTop: 28, marginBottom: 12 }}>
        <span className="uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}>
          Owner notes
        </span>
        {saveLabel && (
          <span style={{ fontSize: '12px', color: saveState === 'error' ? '#B42318' : tokens.inkSoft }}>{saveLabel}</span>
        )}
      </div>
      <textarea
        value={notes}
        maxLength={MAX_NOTES}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
        rows={4}
        placeholder="Private notes about this client…"
        className="w-full"
        style={{
          background: tokens.surface,
          border: `1px solid ${tokens.hairline}`,
          borderRadius: tokens.radiusControl,
          padding: '10px 12px',
          fontSize: '14px',
          color: tokens.ink,
          outline: 'none',
          resize: 'vertical',
          fontFamily: tokens.font,
        }}
      />
      <div style={{ fontSize: '12px', color: tokens.inkSoft, marginTop: 4, textAlign: 'right' }}>
        {notes.length}/{MAX_NOTES}
      </div>

      {/* Tags */}
      <div className="uppercase" style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft, marginTop: 20, marginBottom: 12 }}>
        Tags
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1"
            style={{
              fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '999px',
              background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)',
            }}
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              aria-label={`Remove ${t}`}
              style={{ background: 'none', cursor: 'pointer', color: 'var(--color-primary)', lineHeight: 1, fontSize: '14px' }}
            >
              ×
            </button>
          </span>
        ))}
        {tags.length < MAX_TAGS && (
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={onTagKeyDown}
            onBlur={() => addTag(tagInput)}
            placeholder="Add tag…"
            maxLength={MAX_TAG_LEN}
            style={{
              fontSize: '13px', padding: '4px 10px', borderRadius: '999px',
              border: `1px solid ${tokens.hairline}`, background: tokens.surface, color: tokens.ink, outline: 'none', width: 120,
            }}
          />
        )}
      </div>
    </div>
  )
}
