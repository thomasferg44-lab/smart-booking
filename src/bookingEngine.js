// Shared, pure helpers for the adaptive booking engine. Imported by the booking
// form (frontend) and by submit-booking.js / admin-update.js (server) so option
// lookups and pricing are derived from the SAME config in both places.
import { companyConfig } from './companyConfig.js'

// Every bookable option across categories and levels, flattened with context.
export function flattenOptions(config = companyConfig) {
  const out = []
  for (const cat of config.services || []) {
    const base = { categoryId: cat.id, categoryLabel: cat.label, bookingMode: cat.bookingMode }
    if (cat.bookingMode === 'level') {
      for (const lvl of cat.levels || []) {
        for (const opt of lvl.options || []) {
          out.push({ ...base, levelId: lvl.id, levelLabel: lvl.label, option: opt })
        }
      }
    } else {
      for (const opt of cat.options || []) {
        out.push({ ...base, levelId: null, levelLabel: null, option: opt })
      }
    }
  }
  return out
}

// Resolve an option id to its trusted metadata (category, mode, price, duration…).
export function findOptionById(optionId, config = companyConfig) {
  return flattenOptions(config).find((e) => e.option.id === optionId) || null
}

export function getCategory(categoryId, config = companyConfig) {
  return (config.services || []).find((c) => c.id === categoryId) || null
}

// Map selected week ids to their config labels (for display / descriptions).
export function weekLabels(categoryId, weekIds = [], config = companyConfig) {
  const cat = getCategory(categoryId, config)
  const opts = cat?.weekOptions || []
  return (weekIds || []).map((id) => opts.find((w) => w.id === id)?.label || id)
}

// ── Currency (KYD primary, USD secondary) ──────────────────────────────────
export const toUsd = (kyd, config = companyConfig) =>
  Number(kyd || 0) * (config.usdRate ?? 0.82)

export const formatKyd = (kyd, config = companyConfig) =>
  `${config.currency || 'KYD'} $${Number(kyd || 0).toFixed(2)}`

export const formatUsd = (kyd, config = companyConfig) =>
  `USD $${toUsd(kyd, config).toFixed(2)}`

// "KYD $100.00 (USD $82.00)"
export const formatMoney = (kyd, config = companyConfig) =>
  `${formatKyd(kyd, config)} (${formatUsd(kyd, config)})`
