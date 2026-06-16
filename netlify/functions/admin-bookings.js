import { createClient } from '@supabase/supabase-js'

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

  const { password } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: bookings, error: dbError } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Supabase select error:', dbError)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load bookings' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ bookings: bookings ?? [] }) }
  } catch (err) {
    console.error('admin-bookings error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
