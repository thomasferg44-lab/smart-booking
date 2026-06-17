// TEMPORARY — manual testing only. DISABLED by default (see the gate below).
//
// Lets Thomas hit ONE endpoint to confirm a real event lands on the calendar:
//   /.netlify/functions/test-calendar?calendarId=<the Google Calendar ID>
//
// Requires the Netlify env vars GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY,
// and the target calendar must be shared with the service-account email.
// Claude does NOT call this — it's an outward-facing step Thomas runs himself.
//
// NEUTRALIZED FOR SHIPPING: responds 404 unless ENABLE_TEST_CALENDAR=true is set.
// Set that env var in Netlify only while verifying Google setup, then unset it
// (or delete this file) once the live pass is done.
import { createCalendarEvent } from './_shared/google-calendar.js'

export const handler = async (event) => {
  // Gate: behave like a non-existent endpoint unless explicitly enabled.
  if (process.env.ENABLE_TEST_CALENDAR !== 'true') {
    return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }) }
  }

  const calendarId = event.queryStringParameters?.calendarId || ''
  if (!calendarId) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Pass ?calendarId=<your Google Calendar ID> to run the test.',
      }),
    }
  }

  // Hardcoded sample event ~24h from now, 30 minutes long, in Cayman time.
  const start = new Date(Date.now() + 24 * 60 * 60 * 1000)

  try {
    const eventId = await createCalendarEvent({
      calendarId,
      summary: 'Calendar sync test — DropStack',
      description: 'Temporary test event created by test-calendar.js. Safe to delete.',
      startISO: start.toISOString(),
      durationMinutes: 30,
      timezone: 'America/Cayman',
      location: 'Test location',
    })
    return { statusCode: 200, body: JSON.stringify({ success: true, eventId }) }
  } catch (err) {
    console.error('test-calendar error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
