// Public, lightweight endpoint to validate ONE discount code at a time.
// Returns { valid, discountPct } for the submitted code only — it never reveals
// the full set of valid codes. Codes live server-side (_shared/discount-codes.js).
import { discountPctFor } from './_shared/discount-codes.js'

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

  const discountPct = discountPctFor(body.code)
  return { statusCode: 200, body: JSON.stringify({ valid: discountPct > 0, discountPct }) }
}
