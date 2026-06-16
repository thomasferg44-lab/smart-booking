import { useMemo } from 'react'
import { tokens } from './adminTheme'
import { formatKyd, formatUsd } from './payments'

function MoneyCard({ label, amount, accent, delay }) {
  return (
    <div
      className="admin-rise accounts-summary-card"
      style={{
        animationDelay: `${delay}ms`,
        background: tokens.surface,
        border: `1px solid ${tokens.hairline}`,
        borderRadius: tokens.radiusCard,
        boxShadow: tokens.shadow,
      }}
    >
      <div
        className="uppercase"
        style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.06em', color: tokens.inkSoft }}
      >
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
        {formatKyd(amount)}
      </div>
      <div
        style={{
          marginTop: '4px',
          fontSize: '13px',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
          color: tokens.inkSoft,
        }}
      >
        {formatUsd(amount)}
      </div>
    </div>
  )
}

export default function AccountsSummary({ bookings }) {
  const totals = useMemo(() => {
    let owed = 0
    let paid = 0
    for (const b of bookings) {
      const price = Number(b.price_kyd || 0)
      if (b.payment_status === 'paid') paid += price
      else owed += price
    }
    return { owed, paid }
  }, [bookings])

  return (
    <div className="grid grid-cols-3 gap-3" style={{ marginBottom: 32 }}>
      <MoneyCard label="Total Owed" amount={totals.owed} delay={0} />
      <MoneyCard label="Paid" amount={totals.paid} delay={40} />
      <MoneyCard label="Outstanding" amount={totals.owed} accent delay={80} />
    </div>
  )
}
