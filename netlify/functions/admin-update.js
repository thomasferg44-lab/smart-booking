import { createClient } from '@supabase/supabase-js'
import { companyConfig } from '../../src/companyConfig.js'
import { createCalendarEvent } from './_shared/google-calendar.js'
import { sendBookingIcsEmail } from './_shared/calendar-email.js'
import { bookingStartISO } from './_shared/datetime.js'

const VALID_STATUSES = ['confirmed', 'cancelled', 'pending']

// Trusted server-side service → duration (minutes) map. Mirrors the PRICES map
// in submit-booking.js: the event duration is read here, never from the client.
// Consumed by the calendar sync wired in Prompt 4. Keep in sync with companyConfig.
export const SERVICE_DURATIONS = {
  'Private lesson (1hr)': 60,
  'Group session (1hr)': 60,
  'Stroke assessment (30min)': 30,
  'Junior squad trial': 60,
}

// Calendar sync for a freshly-confirmed booking. Best-effort and NON-BLOCKING:
// every failure is logged and returned as a warning string, never thrown — a
// calendar or email failure must not block the confirmation (CLAUDE.md rule 5).
// Returns null on full success, or a human warning on partial/total failure.
async function syncConfirmedBooking(supabase, row) {
  // Shared inputs read from trusted server-side sources only (never client input).
  let startISO, summary, description, durationMinutes
  try {
    durationMinutes = SERVICE_DURATIONS[row.service]
    if (!durationMinutes) throw new Error(`No duration configured for service "${row.service}"`)
    startISO = bookingStartISO(row.requested_date, row.requested_time, companyConfig.timezone)
    summary = `${row.service} — ${row.name}`
    description = [
      `Customer: ${row.name}`,
      `Email: ${row.email}`,
      ...(row.phone ? [`Phone: ${row.phone}`] : []),
      `Service: ${row.service}`,
      `Price: KYD $${Number(row.price_kyd || 0).toFixed(2)}`,
    ].join('\n')
  } catch (err) {
    console.error('Calendar sync prep failed:', err)
    return 'Booking confirmed, but calendar sync could not run (check the service date/time).'
  }

  const failed = []

  // 1) Business Google Calendar event. On success, persist the event id so this
  //    is never recreated (idempotency) and the admin UI can show "Synced".
  try {
    if (!companyConfig.calendarId) throw new Error('companyConfig.calendarId is not set')
    const eventId = await createCalendarEvent({
      calendarId: companyConfig.calendarId,
      summary,
      description,
      startISO,
      durationMinutes,
      timezone: companyConfig.timezone,
      location: companyConfig.location,
    })
    const { error: storeErr } = await supabase
      .from('bookings')
      .update({ calendar_event_id: eventId, calendar_synced_at: new Date().toISOString() })
      .eq('id', row.id)
    if (storeErr) throw new Error(`could not store calendar_event_id: ${storeErr.message}`)
  } catch (err) {
    console.error('Calendar event creation failed:', err)
    failed.push('calendar')
  }

  // 2) Customer .ics invite email — independent of the calendar write above.
  try {
    await sendBookingIcsEmail({
      to: row.email,
      customerName: row.name,
      summary,
      description,
      serviceName: row.service,
      startISO,
      durationMinutes,
      timezone: companyConfig.timezone,
      location: companyConfig.location,
      uid: `${row.id}@dropstack.co`,
    })
  } catch (err) {
    console.error('Calendar invite email failed:', err)
    failed.push('invite email')
  }

  return failed.length ? `Booking confirmed, but ${failed.join(' and ')} sync failed.` : null
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body
  try {
    body = JSON.parse(event.body)
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  const { password, id, status } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (!id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing booking id' }) }
  }

  if (!VALID_STATUSES.includes(status)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid status' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: row, error: dbError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select('id, name, email, phone, service, requested_date, requested_time, price_kyd, status, calendar_event_id')
      .single()

    if (dbError || !row) {
      console.error('Supabase update error:', dbError)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update booking' }) }
    }

    // Calendar sync only when newly confirmed and not already synced (idempotent).
    let warning = null
    if (row.status === 'confirmed' && !row.calendar_event_id) {
      warning = await syncConfirmedBooking(supabase, row)
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...(warning ? { warning } : {}) }),
    }
  } catch (err) {
    console.error('admin-update error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
