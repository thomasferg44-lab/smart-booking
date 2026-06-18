import { createClient } from '@supabase/supabase-js'

// Persists owner notes + tags for a client (keyed by email) in the `clients`
// table. Notes and tags are INDEPENDENT — sending only one never wipes the other.
// Auth mirrors the other admin functions (POST with { password }).

const MAX_NOTES = 2000
const MAX_TAGS = 10
const MAX_TAG_LEN = 30

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

  const { password, email, notes, tags } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (typeof email !== 'string' || email.trim() === '') {
    return { statusCode: 400, body: JSON.stringify({ error: 'A valid email is required' }) }
  }

  // notes: optional. `null` clears it; a string must be within the length cap.
  if (notes !== undefined && notes !== null) {
    if (typeof notes !== 'string') {
      return { statusCode: 400, body: JSON.stringify({ error: 'notes must be a string' }) }
    }
    if (notes.length > MAX_NOTES) {
      return { statusCode: 400, body: JSON.stringify({ error: `notes must be ${MAX_NOTES} characters or fewer` }) }
    }
  }

  // tags: optional. If provided, must be an array of short strings (capped count).
  if (tags !== undefined) {
    if (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'tags must be an array of strings' }) }
    }
    if (tags.length > MAX_TAGS) {
      return { statusCode: 400, body: JSON.stringify({ error: `a maximum of ${MAX_TAGS} tags is allowed` }) }
    }
    if (tags.some((t) => t.length > MAX_TAG_LEN)) {
      return { statusCode: 400, body: JSON.stringify({ error: `each tag must be ${MAX_TAG_LEN} characters or fewer` }) }
    }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    // Partial upsert: only include fields that were provided. On conflict this
    // updates just those columns, leaving the other (notes/tags) untouched.
    const row = { email, updated_at: new Date().toISOString() }
    if (notes !== undefined) row.notes = notes
    if (tags !== undefined) row.tags = tags

    const { data, error } = await supabase
      .from('clients')
      .upsert(row, { onConflict: 'email' })
      .select('email, notes, tags')
      .single()

    if (error) {
      console.error('admin-client-note upsert error:', error)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save client record' }) }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, email: data.email, notes: data.notes ?? null, tags: data.tags || [] }),
    }
  } catch (err) {
    console.error('admin-client-note error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
