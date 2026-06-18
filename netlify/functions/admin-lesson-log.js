import { createClient } from '@supabase/supabase-js'

// Admin-only: record a lesson delivered for a client (one row in lesson_logs,
// optionally for several lessons on one date via lessons_count). Auth mirrors the
// other admin functions (POST with { password }).

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

  const { password, booking_id, client_email, lesson_date, lessons_count, notes } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (typeof client_email !== 'string' || client_email.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'client_email is required' }) }
  }
  if (!lesson_date || Number.isNaN(new Date(lesson_date).getTime())) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A valid lesson_date is required' }) }
  }
  const count = Number.parseInt(lessons_count, 10)
  if (!Number.isFinite(count) || count < 1 || count > 20) {
    return { statusCode: 400, body: JSON.stringify({ error: 'lessons_count must be between 1 and 20' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from('lesson_logs')
      .insert({
        booking_id: booking_id || null,
        client_email,
        lesson_date,
        lessons_count: count,
        notes: notes || null,
      })
      .select('id, booking_id, client_email, lesson_date, lessons_count, notes, logged_at')
      .single()

    if (error) {
      console.error('admin-lesson-log insert error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to log lesson' }) }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, log: data }) }
  } catch (err) {
    console.error('admin-lesson-log error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
