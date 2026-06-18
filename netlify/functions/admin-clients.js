import { createClient } from '@supabase/supabase-js'

// Server-side CRM data layer. Client records are DERIVED from the bookings table
// (one record per unique email); the only stored CRM data is notes + tags in the
// `clients` table, merged in via a left-join-style lookup.
//
// Auth mirrors admin-update.js / admin-pay.js: POST with { password } in the body.
//   - No ?email=  → aggregated list of all clients (sorted by last booking DESC).
//   - ?email=X    → full booking history for that one client (newest first).

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) }
  }

  if (body.password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
    const emailParam = event.queryStringParameters?.email

    // ── Single client: full booking history, newest first ───────────────────
    if (emailParam) {
      const { data: rows, error } = await supabase
        .from('bookings')
        .select(
          'id, created_at, category_id, category_label, option_name, service, requested_date, requested_time, selected_weeks, level, booking_mode, status, payment_status, price_kyd, lesson_quantity, calendar_event_id',
        )
        .eq('email', emailParam)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('admin-clients history error:', error)
        return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load client history' }) }
      }

      const history = (rows || []).map((b) => ({
        id: b.id,
        created_at: b.created_at,
        category_id: b.category_id,
        category_label: b.category_label,
        option_name: b.option_name,
        service: b.service, // legacy fallback for display
        requested_date: b.requested_date,
        time_slot: b.requested_time, // engine stores the time in `requested_time`
        selected_weeks: b.selected_weeks,
        level: b.level,
        booking_mode: b.booking_mode,
        status: b.status,
        payment_status: b.payment_status,
        price_kyd: Number(b.price_kyd || 0),
        lesson_quantity: b.lesson_quantity || 1,
        calendar_event_id: b.calendar_event_id,
      }))

      return { statusCode: 200, body: JSON.stringify({ history }) }
    }

    // ── All clients: aggregate one record per unique email ──────────────────
    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('email, name, phone, created_at, price_kyd, status, payment_status')
      .order('created_at', { ascending: false })

    if (bErr) {
      console.error('admin-clients bookings error:', bErr)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load clients' }) }
    }

    // Notes + tags from the clients table. Degrade gracefully if the table
    // doesn't exist yet (crm-setup.sql is run before P4): no notes/tags.
    let meta = new Map()
    const { data: clientRows, error: cErr } = await supabase.from('clients').select('email, notes, tags')
    if (cErr) {
      console.warn('admin-clients: clients table unavailable (run crm-setup.sql) —', cErr.message)
    } else {
      meta = new Map((clientRows || []).map((c) => [c.email, c]))
    }

    // Bookings come back created_at DESC, so the first row seen for an email is
    // their most recent booking — use it for name/phone and lastBooking.
    const byEmail = new Map()
    for (const b of bookings || []) {
      if (!b.email) continue
      let c = byEmail.get(b.email)
      if (!c) {
        c = {
          email: b.email,
          name: b.name || null,
          phone: b.phone || null,
          totalBookings: 0,
          lifetimeValue: 0,
          outstanding: 0,
          firstBooking: b.created_at,
          lastBooking: b.created_at,
        }
        byEmail.set(b.email, c)
      }
      c.totalBookings += 1
      const price = Number(b.price_kyd || 0)
      if (b.payment_status === 'paid') c.lifetimeValue += price
      if (b.status === 'confirmed' && b.payment_status !== 'paid') c.outstanding += price
      if (new Date(b.created_at) < new Date(c.firstBooking)) c.firstBooking = b.created_at
      if (new Date(b.created_at) > new Date(c.lastBooking)) c.lastBooking = b.created_at
    }

    const clients = [...byEmail.values()].map((c) => {
      const m = meta.get(c.email)
      return { ...c, tags: m?.tags || [], notes: m?.notes ?? null }
    })
    clients.sort((a, b) => new Date(b.lastBooking) - new Date(a.lastBooking))

    return { statusCode: 200, body: JSON.stringify({ clients }) }
  } catch (err) {
    console.error('admin-clients error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
