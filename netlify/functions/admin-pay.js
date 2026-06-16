import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Fixed rate — 1 KYD = 0.82 USD (standard Cayman peg). USD is display-only.
const USD_RATE = 0.82

const VALID_METHODS = ['cash', 'bank_transfer', 'other']

const METHOD_LABELS = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  other: 'Other',
}

const formatValue = (value) => {
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

const formatPrice = (priceKyd) => {
  const kyd = Number(priceKyd || 0)
  return `KYD $${kyd.toFixed(2)} (USD $${(kyd * USD_RATE).toFixed(2)})`
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

  const { password, bookingId, paymentDate, paymentMethod } = body

  if (password !== process.env.ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (!bookingId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing booking id' }) }
  }

  if (!VALID_METHODS.includes(paymentMethod)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payment method' }) }
  }

  if (!paymentDate || Number.isNaN(new Date(paymentDate).getTime())) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid payment date' }) }
  }

  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { data: row, error: dbError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        payment_date: paymentDate,
        payment_method: paymentMethod,
      })
      .eq('id', bookingId)
      .select('id, name, email, service, requested_date, requested_time, price_kyd')
      .single()

    if (dbError || !row) {
      console.error('Supabase update error:', dbError)
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to update booking' }) }
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const accentColor = process.env.PRIMARY_COLOR || '#21B7B5'

    const receiptHtml = emailLayout({
      heading: process.env.COMPANY_NAME,
      intro: `Hi ${row.name}, thank you — we've received your payment. Here's your receipt:`,
      rows: [
        summaryRow('Student name', row.name),
        summaryRow('Service', row.service),
        summaryRow('Lesson date', formatDate(row.requested_date)),
        summaryRow('Lesson time', row.requested_time),
        summaryRow('Amount paid', formatPrice(row.price_kyd)),
        summaryRow('Payment method', METHOD_LABELS[paymentMethod]),
        summaryRow('Date received', formatDate(paymentDate)),
        summaryRow('Reference', row.id),
      ].join(''),
      accentColor,
      footer: 'Thank you for your business — we look forward to seeing you at the pool!',
    })

    await resend.emails.send({
      from: `DropStack <bookings@dropstack.co>`,
      to: row.email,
      replyTo: process.env.OWNER_EMAIL,
      subject: `Payment received — ${row.service}`,
      html: receiptHtml,
    })

    return { statusCode: 200, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('admin-pay error:', err)
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong' }) }
  }
}
