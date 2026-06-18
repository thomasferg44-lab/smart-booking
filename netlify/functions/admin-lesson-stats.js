import { createClient } from '@supabase/supabase-js'

// Admin-only: lesson-tracker stats for one client (by email). Auth mirrors the
// other admin functions (POST with { password }); email is passed as ?email=.
//   totalLessonsLogged — sum of lessons_count across their lesson_logs
//   totalLessonsPaid   — sum of lesson_quantity across their confirmed bookings
//   remaining          — paid - logged (can be 0 or negative if over-delivered)
//   logs               — their lesson_logs, newest first

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

  const email = event.queryStringParameters?.email
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'email is required' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: logs, error: logErr } = await supabase
      .from('lesson_logs')
      .select('id, booking_id, lesson_date, lessons_count, notes, logged_at')
      .eq('client_email', email)
      .order('logged_at', { ascending: false })

    if (logErr) {
      console.error('admin-lesson-stats logs error:', logErr)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load lesson logs' }) }
    }

    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('lesson_quantity, status')
      .eq('email', email)
      .eq('status', 'confirmed')

    if (bErr) {
      console.error('admin-lesson-stats bookings error:', bErr)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load bookings' }) }
    }

    const totalLessonsLogged = (logs || []).reduce((s, l) => s + Number(l.lessons_count || 0), 0)
    const totalLessonsPaid = (bookings || []).reduce((s, b) => s + Number(b.lesson_quantity || 1), 0)

    return {
      statusCode: 200,
      body: JSON.stringify({
        totalLessonsLogged,
        totalLessonsPaid,
        remaining: totalLessonsPaid - totalLessonsLogged,
        logs: logs || [],
      }),
    }
  } catch (err) {
    console.error('admin-lesson-stats error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
