import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const formatLabel = (key) =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

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

const intakeRows = (intakeData = {}) =>
  Object.entries(intakeData)
    .filter(([, value]) => formatValue(value) !== '—')
    .map(([key, value]) => summaryRow(formatLabel(key), value))
    .join('')

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

  const { name, email, phone, service, date, time, intake = {}, notes } = body

  if (!name || !email || !service || !date || !time) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) }
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: row, error: dbError } = await supabase
    .from('bookings')
    .insert({
      name,
      email,
      phone: phone || null,
      service,
      requested_date: date,
      requested_time: time,
      intake_data: intake,
      notes: notes || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (dbError) {
    console.error('Supabase insert error:', dbError)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save booking' }) }
  }

  const bookingId = row.id
  const resend = new Resend(process.env.RESEND_API_KEY)
  const accentColor = process.env.PRIMARY_COLOR || '#21B7B5'

  const clientHtml = emailLayout({
    heading: process.env.COMPANY_NAME,
    intro: `Hi ${name}, thanks for your booking request! Here's a summary:`,
    rows: [
      summaryRow('Service', service),
      summaryRow('Date', formatDate(date)),
      summaryRow('Time', time),
      intakeRows(intake),
      summaryRow('Reference', bookingId),
    ].join(''),
    accentColor,
    footer: "We'll be in touch shortly to confirm your appointment.",
  })

  const ownerHtml = emailLayout({
    heading: `New booking — ${service}`,
    intro: `${name} just requested a booking.`,
    rows: [
      summaryRow('Name', name),
      summaryRow('Email', email),
      summaryRow('Phone', phone),
      summaryRow('Service', service),
      summaryRow('Date', formatDate(date)),
      summaryRow('Time', time),
      intakeRows(intake),
      summaryRow('Notes', notes),
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
      subject: `New booking from ${name} — ${service}`,
      html: ownerHtml,
    }),
  ])

  return { statusCode: 200, body: JSON.stringify({ success: true, bookingId }) }
}
