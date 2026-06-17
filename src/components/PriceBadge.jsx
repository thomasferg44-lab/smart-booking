import { companyConfig } from '../companyConfig'
import { toUsd } from '../bookingEngine'

// KYD primary, USD secondary. Packages show a small "paid upfront" tag.
function PriceBadge({ price, isPackage = false }) {
  const kyd = Number(price || 0)
  if (!kyd) return null

  const cur = companyConfig.currency || 'KYD'

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
          color: 'var(--color-primary)',
        }}
      >
        {cur} ${kyd.toFixed(2)}
        <span className="text-gray-500 font-normal">(USD ${toUsd(kyd).toFixed(2)})</span>
      </span>
      {isPackage && (
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wide"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          paid upfront
        </span>
      )}
    </span>
  )
}

export default PriceBadge
