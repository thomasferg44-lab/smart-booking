import { createClient } from '@supabase/supabase-js'

// Admin-only: create a booking manually (e.g. entering past bookings). This is an
// ADDITION — it does not change the public booking form or any existing flow.
// Auth mirrors the other admin functions (POST with { password }).

const STATUSES = ['pending', 'confirmed', 'cancelled']
const PAYMENTS = ['unpaid', 'paid']
const METHODS = ['cash', 'bank_transfer', 'other']

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

  const { password, name, email, phone, service, date, time, priceKyd, status, paymentStatus, paymentMethod } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (typeof name !== 'string' || name.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Client name is required' }) }
  }
  if (typeof email !== 'string' || email.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email is required' }) }
  }
  if (typeof service !== 'string' || service.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'Service is required' }) }
  }

  // Booking date (optional). If given, it must be valid; it also back-dates the
  // record (created_at) so past bookings sit correctly in history.
  let bookingDate = null
  if (date) {
    if (Number.isNaN(new Date(`${date}T00:00:00`).getTime())) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid date' }) }
    }
    bookingDate = date
  }

  const st = STATUSES.includes(status) ? status : 'confirmed'
  const pay = PAYMENTS.includes(paymentStatus) ? paymentStatus : 'unpaid'
  const priceNum = Number(priceKyd)
  const price = Number.isFinite(priceNum) && priceNum >= 0 ? priceNum : 0
  const method = pay === 'paid' ? (METHODS.includes(paymentMethod) ? paymentMethod : 'other') : null
  const paymentDate = pay === 'paid' ? bookingDate || new Date().toISOString().split('T')[0] : null

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const row = {
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      service: service.trim(),
      requested_date: bookingDate,
      requested_time: time?.trim() || null,
      price_kyd: price,
      status: st,
      payment_status: pay,
      payment_date: paymentDate,
      payment_method: method,
    }
    // Back-date the record to the booking date when provided.
    if (bookingDate) row.created_at = new Date(`${bookingDate}T12:00:00Z`).toISOString()

    const { data, error } = await supabase.from('bookings').insert(row).select('id').single()
    if (error) {
      console.error('admin-create-booking insert error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to create booking' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, bookingId: data.id }) }
  } catch (err) {
    console.error('admin-create-booking error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
