// Sends the customer a booking-confirmation email with a .ics calendar invite
// attached. Created in Prompt 3. NOT wired into the confirm flow yet (Prompt 4).
//
// Mirrors the existing receipt email (admin-pay.js): same Resend sender, same
// emailLayout markup, so styling and from-address stay consistent.
import { Resend } from 'resend'
import { buildIcs } from './ics.js'

const formatValue = (value) => {
  if (value === undefined || value === null || value === '') return '—'
  return value
}

const formatDateTime = (iso, timezone) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
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

/**
 * Build a .ics and email it to the customer via Resend, with the invite attached.
 * Designed to be called from the Prompt 4 confirm flow (wrapped in try/catch there
 * so a failure never blocks confirmation). Throws on send failure.
 *
 * @param {object}  opts
 * @param {string}  opts.to               Customer email address.
 * @param {string}  opts.customerName     For the greeting.
 * @param {string}  opts.summary          Event title (also drives the .ics SUMMARY).
 * @param {string}  opts.description      Event details (.ics DESCRIPTION).
 * @param {string}  opts.serviceName      Service name, shown in the body.
 * @param {string}  opts.startISO         Absolute ISO start instant.
 * @param {number}  opts.durationMinutes  Length in minutes.
 * @param {string}  opts.timezone         IANA timezone for display + .ics.
 * @param {string} [opts.location]        Optional location.
 * @param {string}  opts.uid              Unique UID for the .ics event.
 * @returns {Promise<object>} the Resend send result data.
 */
export async function sendBookingIcsEmail({
  to,
  customerName,
  summary,
  description,
  serviceName,
  startISO,
  durationMinutes,
  timezone,
  location,
  uid,
}) {
  const ics = buildIcs({
    uid,
    summary,
    description,
    startISO,
    durationMinutes,
    timezone,
    location,
    organizerName: process.env.COMPANY_NAME,
    organizerEmail: process.env.OWNER_EMAIL,
  })

  const accentColor = process.env.PRIMARY_COLOR || '#21B7B5'
  const html = emailLayout({
    heading: process.env.COMPANY_NAME,
    intro: `Hi ${customerName}, your booking is confirmed. We've attached a calendar invite — open <strong>booking.ics</strong> to add it to your calendar.`,
    rows: [
      summaryRow('Service', serviceName),
      summaryRow('When', formatDateTime(startISO, timezone)),
      summaryRow('Where', location),
    ].join(''),
    accentColor,
    footer: 'See you then! If you need to make a change, just reply to this email.',
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { data, error } = await resend.emails.send({
    from: `DropStack <bookings@dropstack.co>`,
    to,
    replyTo: process.env.OWNER_EMAIL,
    subject: `Your booking is confirmed — ${process.env.COMPANY_NAME}`,
    html,
    attachments: [
      {
        filename: 'booking.ics',
        content: Buffer.from(ics, 'utf-8'),
        contentType: 'text/calendar',
      },
    ],
  })

  if (error) {
    throw new Error(`sendBookingIcsEmail failed: ${error.message || error}`, { cause: error })
  }
  return data
}
