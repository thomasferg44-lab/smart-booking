import { companyConfig } from '../companyConfig'

export const brandName = companyConfig.name
export const accent = companyConfig.primaryColor || '#21B7B5'

// accent at ~10% opacity, for soft fills behind accented elements.
export const accentWash = (color = accent, opacity = 0.1) =>
  `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`

// Design tokens from DESIGN-BRIEF.md — the single source for the admin look.
export const tokens = {
  canvas: '#FBFBFD',
  surface: '#FFFFFF',
  ink: '#1D1D1F',
  inkSoft: '#6E6E73',
  hairline: '#E8E8ED',
  accent,
  accentWash: accentWash(),
  radiusCard: '14px',
  radiusControl: '10px',
  radiusPill: '999px',
  shadow: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)',
  shadowHover: '0 1px 2px rgba(0,0,0,.05), 0 12px 32px rgba(0,0,0,.06)',
  font: 'Inter, system-ui, sans-serif',
}

// Muted status inks on their soft washes, per the brief.
export const statusColors = {
  pending: { ink: '#B7791F', wash: '#FEF6E7', label: 'Pending' },
  confirmed: { ink: '#1A7F5A', wash: '#E7F5EE', label: 'Confirmed' },
  cancelled: { ink: '#8A8A8E', wash: '#F2F2F4', label: 'Cancelled' },
  // Payment statuses reuse the same inks: Paid = green, Unpaid = amber.
  paid: { ink: '#1A7F5A', wash: '#E7F5EE', label: 'Paid' },
  unpaid: { ink: '#B7791F', wash: '#FEF6E7', label: 'Unpaid' },
}
