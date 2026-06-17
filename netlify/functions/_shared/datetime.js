// Combine a booking's date + time-slot into an absolute ISO instant, interpreting
// the wall-clock time in the business timezone. Works for any IANA timezone
// (including DST) via Intl offset computation. Created in Prompt 4.

// "8:00 am" / "12:30 pm" -> { hour, minute } in 24h.
const parseTimeSlot = (timeStr) => {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec(String(timeStr).trim())
  if (!m) return null
  let hour = Number(m[1]) % 12
  if (/pm/i.test(m[3])) hour += 12
  return { hour, minute: Number(m[2]) }
}

// Offset (in minutes) of `timeZone` at the instant `date`.
const offsetMinutes = (date, timeZone) => {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const p = {}
  for (const part of dtf.formatToParts(date)) p[part.type] = part.value
  let hour = Number(p.hour)
  if (hour === 24) hour = 0 // some environments emit '24' for midnight
  const asUTC = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), hour, Number(p.minute), Number(p.second))
  return (asUTC - date.getTime()) / 60000
}

/**
 * @param {string} dateStr   e.g. '2026-06-20'
 * @param {string} timeStr   e.g. '8:00 am'
 * @param {string} timeZone  IANA name, e.g. 'America/Cayman'
 * @returns {string} absolute ISO instant, e.g. '2026-06-20T13:00:00.000Z'
 */
export const bookingStartISO = (dateStr, timeStr, timeZone) => {
  const [y, mo, d] = String(dateStr).split('-').map(Number)
  const t = parseTimeSlot(timeStr)
  if (!y || !mo || !d || !t) {
    throw new Error(`bookingStartISO: cannot parse "${dateStr}" / "${timeStr}"`)
  }
  // Treat the wall time as UTC, then correct by the zone's offset at that instant.
  const guessUTC = Date.UTC(y, mo - 1, d, t.hour, t.minute)
  const off = offsetMinutes(new Date(guessUTC), timeZone)
  let utc = guessUTC - off * 60000
  // Re-check once to settle DST boundaries (no-op for fixed-offset zones like Cayman).
  const off2 = offsetMinutes(new Date(utc), timeZone)
  if (off2 !== off) utc = guessUTC - off2 * 60000
  return new Date(utc).toISOString()
}
