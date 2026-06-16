import { createClient } from '@supabase/supabase-js'

const VALID_STATUSES = ['confirmed', 'cancelled', 'pending']

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

    const { error: dbError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)

    if (dbError) {
      console.error('Supabase update error:', dbError)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update booking' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('admin-update error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
