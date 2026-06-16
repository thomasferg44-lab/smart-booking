import { statusColors } from './adminTheme'

export default function StatusPill({ status }) {
  const c = statusColors[status] || statusColors.pending

  return (
    <span
      className="inline-flex items-center gap-[6px] uppercase"
      style={{
        background: c.wash,
        color: c.ink,
        borderRadius: '999px',
        padding: '4px 10px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.06em',
        // soft spring when status changes colour
        transition: 'background-color .45s cubic-bezier(.34,1.56,.64,1), color .45s cubic-bezier(.34,1.56,.64,1)',
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '999px',
          background: c.ink,
          transition: 'background-color .45s cubic-bezier(.34,1.56,.64,1)',
        }}
      />
      {c.label}
    </span>
  )
}
