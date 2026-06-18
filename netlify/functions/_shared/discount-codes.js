// SERVER-ONLY discount codes. Do NOT import this from anything under src/ — it
// must never enter the client bundle. The client only sends a code STRING; the
// server (submit-booking.js / validate-discount.js) looks up the percentage here.
const DISCOUNT_CODES = {
  GRANT5: 5,
  GRANT10: 10,
  GRANT20: 20,
  GRANT25: 25,
}

// Discount percent for a code (case-insensitive, trimmed), or 0 if unknown.
export const discountPctFor = (code) =>
  DISCOUNT_CODES[String(code || '').trim().toUpperCase()] ?? 0
