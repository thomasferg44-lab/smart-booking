// Shared payment/currency helpers for the Accounts tab.
// Fixed rate — 1 KYD = 0.82 USD (standard Cayman peg). USD is display-only.
export const USD_RATE = 0.82

export const toUsd = (kyd) => Number(kyd || 0) * USD_RATE

// "KYD $75.00"
export const formatKyd = (kyd) => `KYD $${Number(kyd || 0).toFixed(2)}`

// "USD $61.50"
export const formatUsd = (kyd) => `USD $${toUsd(kyd).toFixed(2)}`

// "KYD $75.00 (USD $61.50)"
export const formatMoney = (kyd) => `${formatKyd(kyd)} (${formatUsd(kyd)})`

// Payment methods — single source for the modal's options and the row's label.
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'other', label: 'Other' },
]

export const methodLabel = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value)?.label || '—'
