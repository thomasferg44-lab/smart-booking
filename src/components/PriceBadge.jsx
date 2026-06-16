// Fixed rate — 1 KYD = 0.82 USD (standard Cayman peg). USD is display-only.
const USD_RATE = 0.82

function PriceBadge({ service, services }) {
  const selected = services.find((option) => option.name === service)
  const price = selected?.price ?? 0

  // Nothing to show until a priced service is selected.
  if (!service || !price) return null

  const kyd = price.toFixed(2)
  const usd = (price * USD_RATE).toFixed(2)

  return (
    <span
      className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-sm font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
        color: 'var(--color-primary)',
      }}
    >
      KYD ${kyd}
      <span className="text-gray-500 font-normal">(USD ${usd})</span>
    </span>
  )
}

export default PriceBadge
