// Builds a standards-compliant single-VEVENT iCalendar (.ics) string (RFC 5545).
// Created in Prompt 3. NOT wired into the booking flow yet (that's Prompt 4).
//
// Timezone handling (v1): times are emitted as UTC ("Z"). `startISO` must be an
// absolute instant (include an offset or Z). Cayman is UTC−5 with no DST, so a
// UTC-anchored DTSTART/DTEND is unambiguous and correct (see CLAUDE.md).

// Date -> iCal UTC basic format, e.g. 20260620T130000Z
const toICSDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

// Escape TEXT values per RFC 5545 §3.3.11. Order matters: backslash first.
const escapeText = (value = '') =>
  String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')

// Param values containing : ; , must be DQUOTE-wrapped (and can't contain a quote).
const quoteParam = (value) => `"${String(value).replace(/"/g, '')}"`

// Fold content lines to <=75 octets per RFC 5545 §3.1; continuation lines start
// with a single space. Byte-aware so multibyte UTF-8 chars are never split.
const foldLine = (line) => {
  const buf = Buffer.from(line, 'utf8')
  if (buf.length <= 75) return line
  let result = ''
  let offset = 0
  let limit = 75
  while (offset < buf.length) {
    let end = Math.min(offset + limit, buf.length)
    // Back off if we'd cut in the middle of a multibyte char (continuation byte = 10xxxxxx).
    while (end < buf.length && (buf[end] & 0xc0) === 0x80) end--
    result += (offset === 0 ? '' : '\r\n ') + buf.slice(offset, end).toString('utf8')
    offset = end
    limit = 74 // continuation lines lose one octet to the leading space
  }
  return result
}

/**
 * Build a .ics string for a single event.
 * Accepts (callers may also pass `timezone`, which v1 ignores — times are UTC):
 * @param {object}  opts
 * @param {string}  opts.uid             Unique event UID.
 * @param {string}  opts.summary         Event title.
 * @param {string}  opts.description     Event details.
 * @param {string}  opts.startISO        Absolute ISO start instant (offset/Z included).
 * @param {number}  opts.durationMinutes Length in minutes.
 * @param {string} [opts.location]       Optional location.
 * @param {string} [opts.organizerName]  Organizer display name.
 * @param {string} [opts.organizerEmail] Organizer email.
 * @returns {string} CRLF-delimited VCALENDAR text.
 */
export function buildIcs({
  uid,
  summary,
  description,
  startISO,
  durationMinutes,
  location,
  organizerName,
  organizerEmail,
}) {
  const start = new Date(startISO)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`buildIcs: invalid startISO "${startISO}"`)
  }
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DropStack//Smart Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeText(uid)}`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
  ]
  if (location) lines.push(`LOCATION:${escapeText(location)}`)
  if (organizerEmail) {
    const cn = organizerName ? `;CN=${quoteParam(organizerName)}` : ''
    lines.push(`ORGANIZER${cn}:mailto:${organizerEmail}`)
  }
  lines.push('END:VEVENT', 'END:VCALENDAR')

  return lines.map(foldLine).join('\r\n')
}
