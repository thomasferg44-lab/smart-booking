import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { findOptionById, getCategory, weekLabels, formatMoney, laneFee, PRIVATE_LOCATIONS, PACK_DISCOUNTS, PACK_SIZES } from '../../src/bookingEngine.js'
import { discountPctFor } from './_shared/discount-codes.js'

const formatValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—'
  if (value === undefined || value === null || value === '') return '—'
  return value
}

const formatDate = (dateStr) => {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const summaryRow = (label, value) => `
  <tr>
    <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#6b7280;font-size:14px;width:40%;">${label}</td>
    <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#111827;font-size:14px;font-weight:500;">${formatValue(value)}</td>
  </tr>`

const emailLayout = ({ heading, intro, rows, accentColor, footer }) => `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="background-color:${accentColor};padding:20px 24px;">
                <span style="color:#ffffff;font-size:18px;font-weight:600;">${heading}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${intro ? `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.5;">${intro}</p>` : ''}
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  ${rows}
                </table>
                ${footer ? `<p style="margin:20px 0 0;color:#6b7280;font-size:13px;line-height:1.5;">${footer}</p>` : ''}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

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

  const { name, email, phone, categoryId, optionId, selectedWeeks, quantity, location, pack, discountCode, date, time } = body

  if (!name || !email || !categoryId || !optionId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  // Server-trusted lookup: resolve the option from config so price, duration,
  // names and booking mode can never be set by the client.
  const entry = findOptionById(optionId)
  if (!entry || entry.categoryId !== categoryId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid service selection' }) }
  }
  const { categoryLabel, bookingMode, levelLabel, option } = entry
  let price = Number(option.price || 0)

  if (bookingMode === 'datetime' && (!date || !time)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Date and time are required for this service' }) }
  }
  if (bookingMode === 'weeks' && !(Array.isArray(selectedWeeks) && selectedWeeks.length)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Please select at least one week' }) }
  }

  // Per-week options are priced base × number of weeks (computed server-side from
  // the trusted option price — never from a client-supplied total). Packages are flat.
  if (bookingMode === 'weeks' && !option.isPackage) {
    price = price * selectedWeeks.length
  }

  // Private Lessons: final = (base × pack discount × qty × code discount) + lane
  // fee × qty. All computed server-side from trusted sources — the trusted option
  // price, the trusted PACK_DISCOUNTS / lane-fee maps, the server-clamped quantity,
  // and the discount % looked up server-side. No client total/fee/% is trusted.
  let lessonQuantity = 1
  let lessonLocation = null
  let lessonPack = null
  let discountCodeStored = null
  let discountPctStored = null
  if (categoryId === 'private-lessons') {
    lessonLocation = PRIVATE_LOCATIONS.some((l) => l.id === location) ? location : 'lions-pool'
    const fee = lessonLocation === 'lions-pool' ? laneFee(option.durationMinutes) : 0

    // Pack fixes the quantity (5 or 10) and may discount the base; otherwise use
    // the client stepper quantity, clamped 1–20.
    lessonPack = pack === 'pack-5' || pack === 'pack-10' ? pack : null
    const packDiscount = PACK_DISCOUNTS[lessonPack] ?? 1
    if (lessonPack) {
      lessonQuantity = PACK_SIZES[lessonPack]
    } else {
      const q = Number.parseInt(quantity, 10)
      lessonQuantity = Number.isFinite(q) ? Math.min(20, Math.max(1, q)) : 1
    }

    // Discount code: validated + applied server-side, to the base price only.
    const codePct = discountPctFor(discountCode)
    if (codePct > 0) {
      discountCodeStored = String(discountCode).trim().toUpperCase()
      discountPctStored = codePct
    }
    const codeDiscount = 1 - codePct / 100

    const base = Number(option.price || 0) * packDiscount * lessonQuantity * codeDiscount
    price = base + fee * lessonQuantity
  }

  const cat = getCategory(categoryId)
  const scheduleNote = entry.levelId
    ? cat?.levels?.find((l) => l.id === entry.levelId)?.scheduleNote
    : cat?.scheduleNote

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: row, error: dbError } = await supabase
    .from('bookings')
    .insert({
      name,
      email,
      phone: phone || null,
      // Keep `service` populated (combined label) for backward-compatible admin display.
      service: `${categoryLabel} — ${option.name}`,
      category_id: categoryId,
      category_label: categoryLabel,
      option_id: optionId,
      option_name: option.name,
      booking_mode: bookingMode,
      duration_minutes: option.durationMinutes ?? null,
      price_kyd: price,
      lesson_quantity: lessonQuantity,
      lesson_location: lessonLocation,
      lesson_pack: lessonPack,
      discount_code: discountCodeStored,
      discount_pct: discountPctStored,
      selected_weeks: selectedWeeks && selectedWeeks.length ? selectedWeeks : null,
      level: levelLabel || null,
      requested_date: bookingMode === 'datetime' ? date : null,
      requested_time: bookingMode === 'datetime' ? time : null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save booking' }) }
  }

  const bookingId = row.id

  // Human-readable "when" line for the emails.
  let whenLabel
  let whenHeading = 'Schedule'
  if (bookingMode === 'datetime') {
    whenHeading = 'When'
    whenLabel = `${formatDate(date)} · ${time}`
  } else if (bookingMode === 'weeks') {
    whenHeading = 'Weeks'
    whenLabel = weekLabels(categoryId, selectedWeeks).join(', ')
  } else {
    whenLabel = scheduleNote || 'We will confirm your schedule shortly'
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const accentColor = process.env.PRIMARY_COLOR || '#21B7B5'

  const detailRows = [
    summaryRow('Service', categoryLabel),
    levelLabel ? summaryRow('Level', levelLabel) : '',
    summaryRow('Option', option.name),
    summaryRow('Price', formatMoney(price)),
    summaryRow(whenHeading, whenLabel),
  ].join('')

  const clientHtml = emailLayout({
    heading: process.env.COMPANY_NAME,
    intro: `Hi ${name}, thanks for your booking request! Here's a summary:`,
    rows: detailRows + summaryRow('Reference', bookingId),
    accentColor,
    footer: "We'll be in touch shortly to confirm your appointment.",
  })

  const ownerHtml = emailLayout({
    heading: `New booking — ${categoryLabel}`,
    intro: `${name} just requested a booking.`,
    rows: [
      summaryRow('Name', name),
      summaryRow('Email', email),
      summaryRow('Phone', phone),
      detailRows,
      summaryRow('Booking ID', bookingId),
    ].join(''),
    accentColor,
  })

  await Promise.all([
    resend.emails.send({
      from: `DropStack <bookings@dropstack.co>`,
      to: email,
      replyTo: process.env.OWNER_EMAIL,
      subject: `Your booking request — ${process.env.COMPANY_NAME}`,
      html: clientHtml,
    }),
    resend.emails.send({
      from: `Booking Bot <onboarding@resend.dev>`,
      to: process.env.OWNER_EMAIL,
      replyTo: email,
      subject: `New booking from ${name} — ${categoryLabel}`,
      html: ownerHtml,
    }),
  ])

  return { statusCode: 200, body: JSON.stringify({ success: true, bookingId }) }
}
