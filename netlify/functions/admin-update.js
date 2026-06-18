import { createClient } from '@supabase/supabase-js'
import { companyConfig } from '../../src/companyConfig.js'
import { weekLabels } from '../../src/bookingEngine.js'
import { createCalendarEvent } from './_shared/google-calendar.js'
import { sendBookingIcsEmail } from './_shared/calendar-email.js'
import { bookingStartISO } from './_shared/datetime.js'

const VALID_STATUSES = ['confirmed', 'cancelled', 'pending']

// Calendar event description, built from trusted booking fields.
function buildDescription(row) {
  const lines = [
    `Customer: ${row.name}`,
    `Email: ${row.email}`,
    row.phone ? `Phone: ${row.phone}` : null,
    `Service: ${row.category_label || row.service}`,
    row.level ? `Level: ${row.level}` : null,
    row.option_name ? `Option: ${row.option_name}` : null,
  ]
  if (Array.isArray(row.selected_weeks) && row.selected_weeks.length) {
    lines.push(`Weeks: ${weekLabels(row.category_id, row.selected_weeks).join(', ')}`)
  }
  lines.push(`Price: KYD $${Number(row.price_kyd || 0).toFixed(2)}`)
  return lines.filter(Boolean).join('\n')
}

// Calendar sync for a freshly-confirmed booking. Best-effort and NON-BLOCKING:
// every failure is logged and returned as a warning string, never thrown — a
// calendar or email failure must not block the confirmation (CLAUDE.md rule 5).
async function syncConfirmedBooking(supabase, row) {
  // Calendar sync applies ONLY to 'datetime' bookings. For fixed/weeks/level modes
  // we do nothing at all — no calendar event, no .ics, no calendar call.
  if (row.booking_mode !== 'datetime') return null

  const summary = `${row.category_label || row.service} — ${row.name}`
  const description = buildDescription(row)
  const durationMinutes = row.duration_minutes || 60

  let startISO
  try {
    startISO = bookingStartISO(row.requested_date, row.requested_time, companyConfig.timezone)
  } catch (err) {
    console.error('Calendar sync prep failed:', err)
    return 'Booking confirmed, but calendar sync could not run (check the booking details).'
  }

  const failed = []

  // 1) Business calendar event (precise timed event).
  try {
    if (!companyConfig.calendarId) throw new Error('companyConfig.calendarId is not set')
    const eventId = await createCalendarEvent({
      calendarId: companyConfig.calendarId,
      summary,
      description,
      timezone: companyConfig.timezone,
      location: companyConfig.location,
      startISO,
      durationMinutes,
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

  // 2) Customer .ics invite.
  try {
    await sendBookingIcsEmail({
      to: row.email,
      customerName: row.name,
      summary,
      description,
      serviceName: row.option_name || row.category_label || row.service,
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
      .select(
        'id, name, email, phone, service, category_id, category_label, option_name, booking_mode, duration_minutes, selected_weeks, level, requested_date, requested_time, price_kyd, status, calendar_event_id, created_at',
      )
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
