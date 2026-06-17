// Shared Google Calendar helper — service-account auth + single-event insert.
// Created in Prompt 2. NOT wired into the booking flow yet (that's Prompt 4).
//
// Auth uses DropStack's shared service account from Netlify env vars:
//   GOOGLE_SERVICE_ACCOUNT_EMAIL  — the service account's client_email
//   GOOGLE_PRIVATE_KEY            — the service account's private_key
import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

// GOOGLE_PRIVATE_KEY is stored in env with escaped "\n" sequences (a PEM can't
// survive a single-line env var otherwise). Convert them back to real newlines
// before the JWT client can parse the key. Do NOT remove this replace().
const getPrivateKey = () => (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

/**
 * Insert one event into a Google Calendar via a service-account JWT.
 *
 * @param {object}  opts
 * @param {string}  opts.calendarId       Target calendar (from companyConfig.calendarId).
 * @param {string}  opts.summary          Event title.
 * @param {string}  opts.description      Event details (customer info goes here, not as attendees).
 * @param {string}  opts.startISO         Event start as an absolute ISO instant (include offset/Z).
 * @param {number}  opts.durationMinutes  Event length in minutes (from the trusted server map).
 * @param {string}  opts.timezone         IANA timezone, e.g. 'America/Cayman'.
 * @param {string} [opts.location]        Optional location string.
 * @returns {Promise<string>} the created Google event's id.
 */
export async function createCalendarEvent({
  calendarId,
  summary,
  description,
  startISO,
  durationMinutes,
  timezone,
  location,
  allDayDate,
}) {
  if (!calendarId) throw new Error('createCalendarEvent: missing calendarId')

  // Two shapes: an all-day event (allDayDate set, for fixed/level/weeks modes)
  // or a precise timed event (startISO + durationMinutes, for datetime mode).
  let timing
  if (allDayDate) {
    // All-day event — `end.date` is exclusive, so it's the day after the start.
    const next = new Date(`${allDayDate}T00:00:00Z`)
    if (Number.isNaN(next.getTime())) {
      throw new Error(`createCalendarEvent: invalid allDayDate "${allDayDate}"`)
    }
    next.setUTCDate(next.getUTCDate() + 1)
    timing = { start: { date: allDayDate }, end: { date: next.toISOString().slice(0, 10) } }
  } else {
    const start = new Date(startISO)
    if (Number.isNaN(start.getTime())) {
      throw new Error(`createCalendarEvent: invalid startISO "${startISO}"`)
    }
    // End time is derived server-side from the trusted duration — never the client.
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
    timing = {
      start: { dateTime: start.toISOString(), timeZone: timezone },
      end: { dateTime: end.toISOString(), timeZone: timezone },
    }
  }

  // Service-account JWT auth. Credentials are DropStack's, shared across clients.
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: getPrivateKey(),
    scopes: SCOPES,
  })

  const calendar = google.calendar({ version: 'v3', auth })

  try {
    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary,
        description,
        ...(location ? { location } : {}),
        // We deliberately do NOT set `attendees` — the customer gets a .ics via
        // Resend instead (see CLAUDE.md: service accounts can't email attendees).
        ...timing,
      },
    })

    const eventId = res.data?.id
    if (!eventId) {
      throw new Error('Google Calendar returned no event id')
    }
    return eventId
  } catch (err) {
    // Re-throw with a clear, descriptive message; the P4 caller catches this so a
    // calendar failure never blocks the booking confirmation (CLAUDE.md rule 5).
    const detail = err?.response?.data?.error?.message || err?.message || String(err)
    throw new Error(`createCalendarEvent failed: ${detail}`, { cause: err })
  }
}
