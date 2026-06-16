# PROMPTS.md — Payment Tracking Feature

Run in the existing `auto-booking` project in Claude Code. One prompt at a time. After each: `npm run build`, confirm zero errors, test, then continue.

Read CLAUDE.md fully before Prompt 1.

---

## PROMPT 1 — Database + companyConfig prices

```
Read CLAUDE.md fully before starting.

We are adding payment tracking to the existing auto-booking project.
Do NOT touch submit-booking.js, the booking form flow, or any existing admin files yet.

Step 1: Update companyConfig.js
Add a `price` field (in KYD) to every service in the services array. Use these
realistic Cayman swim school prices as defaults — the owner will adjust them
later via Prompt C:
- "Private lesson (1hr)" → 75.00
- "Stroke assessment (30min)" → 45.00
- "Group lesson (1hr)" → 40.00
- "Open water session (1hr)" → 65.00
If companyConfig has different services, add price: 0.00 as a placeholder and
note which ones need real values.

The services array should now look like:
{ name: "Private lesson (1hr)", price: 75.00 }

Step 2: Update submit-booking.js (the ONE exception to "don't touch it")
When a booking is submitted, look up the price for the selected service from
the request body's service field — but the price must come from a server-side
prices map, NOT from the frontend (clients must not be able to send their own
price). In submit-booking.js, hardcode a PRICES object that mirrors
companyConfig's prices:
const PRICES = {
  "Private lesson (1hr)": 75.00,
  "Stroke assessment (30min)": 45.00,
  // etc.
}
Then when inserting to Supabase, add:
price_kyd: PRICES[service] ?? 0.00

This ensures the price is always set server-side. If the service isn't in PRICES,
it defaults to 0.00 and the owner can set it manually in the dashboard.

Run npm run build. Confirm zero errors. List exactly what you changed in
companyConfig.js and submit-booking.js.
```

---

## PROMPT 2 — Price badge on booking form

```
Read CLAUDE.md.

Add a price display to the booking form so clients see what they'll pay
before submitting. This is read-only — clients cannot change the price.

Create src/components/PriceBadge.jsx:
- Props: service (string), services (array from companyConfig)
- Looks up the price for the selected service
- Displays: "KYD $75.00 (USD $61.50)" using a fixed rate of 1 KYD = 0.82 USD
- If no service selected or price is 0, shows nothing
- Styled calmly — a small pill or inline text matching the existing form style
- Not a separate step, just appears on step 1 below or next to the service
  dropdown as soon as a service is selected

Wire PriceBadge into the existing step 1 of the booking form (the service
selection step). Import companyConfig.services and pass them through.

Run npm run build. Open localhost:8888, select a service on step 1 and confirm
the price appears correctly in both KYD and USD. Screenshot and show me.
```

---

## PROMPT 3 — admin-pay Netlify function

```
Read CLAUDE.md.

Create netlify/functions/admin-pay.js — a new password-gated function that:
1. Accepts POST only (405 otherwise).
2. Parses body: { password, bookingId, paymentDate, paymentMethod }.
3. Validates password against process.env.ADMIN_PASSWORD (401 if wrong).
4. Validates bookingId is present (400 if missing).
5. Validates paymentMethod is one of: 'cash', 'bank_transfer', 'other' (400 if not).
6. Validates paymentDate is a valid date string (400 if not).
7. Updates the bookings row:
   payment_status = 'paid'
   payment_date = paymentDate
   payment_method = paymentMethod
   Also selects back: name, email, service, requested_date, requested_time,
   price_kyd, booking reference (id).
8. Sends a receipt email via Resend to the client's email address:
   - From: bookings@dropstack.co (or process.env.REPLY_TO_EMAIL)
   - Subject: "Payment received — [service]"
   - Branded HTML email (match the style of existing emails in submit-booking.js)
   - Shows: student name, service, lesson date + time, amount paid KYD + USD
     (1 KYD = 0.82 USD), payment method (human-readable: "Bank transfer" not
     "bank_transfer"), booking reference, thank you message.
9. Returns 200 { success: true } on completion.
10. try/catch with generic 500 on failure.

Do NOT put the Supabase service key or Resend key in frontend code.
Do NOT modify any existing functions.

Run npm run build, confirm zero errors.
```

---

## PROMPT 4 — Accounts tab UI

```
Read CLAUDE.md and DESIGN-BRIEF.md (the admin dashboard design spec).

Add an Accounts tab to the existing /admin dashboard. The tab navigation
sits at the top of the dashboard, below the frosted command bar:
  [ Bookings ]  [ Accounts ]
The active tab uses the accent colour underline. Switching tabs is instant
(no page reload).

Create src/admin/AccountsSummary.jsx:
- Three stat cards matching the existing dashboard stat card style:
  "Total Owed" — sum of price_kyd for all unpaid bookings
  "Paid" — sum of price_kyd for all paid bookings
  "Outstanding" — same as Total Owed (unpaid)
- Each card shows KYD primary, USD secondary in smaller text below
- "Outstanding" card uses the accent colour for its number (matches the
  Pending card pattern in the existing dashboard)

Create src/admin/PaymentRow.jsx:
- One booking in the accounts view
- Shows: client name, service, lesson date, price in KYD + USD, payment status pill
  (Paid = green, Unpaid = amber — matching StatusPill style)
- If paid: also shows payment date and payment method (human-readable)
- If unpaid: shows a "Mark as Paid" button (accent colour, small)
- Clicking "Mark as Paid" opens PayModal

Create src/admin/PayModal.jsx:
- A clean modal overlay (blurred backdrop, centred card)
- Title: "Record payment"
- Shows booking summary: client name, service, amount (KYD + USD)
- Two inputs:
  1. Date received (date picker, defaults to today)
  2. Payment method (select: Cash / Bank transfer / Other)
- Two buttons: "Cancel" (grey) and "Confirm payment" (accent)
- On confirm: calls admin-pay with { password, bookingId, paymentDate,
  paymentMethod }, shows loading state, closes on success, shows toast
  "Payment recorded. Receipt sent to [client email]."
- On error: shows inline error, keeps modal open

Create src/admin/AccountsTab.jsx:
- Receives: bookings (array), password (string), onPaymentRecorded (callback)
- Renders AccountsSummary at top
- Two filters below summary (matching existing dashboard filter style):
  1. Date range: "From" and "To" date inputs
  2. Payment status: All / Paid / Outstanding (segmented control)
- Filtered list of PaymentRows below
- Empty state: "No bookings match these filters."
- When a payment is recorded, calls onPaymentRecorded so the parent
  refreshes the bookings from Supabase

Wire AccountsTab into AdminApp.jsx alongside the existing Dashboard (Bookings tab).
The accounts tab receives the same bookings data already loaded — no extra
Supabase call needed.

Run npm run build. Open /admin locally, click Accounts tab. Confirm:
- Summary cards show correct totals from your test bookings
- PaymentRows render for each booking
- Filters work
- PayModal opens on "Mark as Paid"

Screenshot and show me.
```

---

## PROMPT 5 — Wire, test end-to-end, deploy

```
Read CLAUDE.md.

End-to-end test checklist — run through each with netlify dev running:

1. Submit a new test booking on / — confirm the price shows on step 1 and the
   booking saves with the correct price_kyd in Supabase.

2. Open /admin → Accounts tab — confirm the new booking appears as Unpaid
   with the correct KYD + USD price.

3. Summary cards show correct totals.

4. Click "Mark as Paid" on the test booking — set date to today, method to
   Bank transfer — confirm:
   - Modal closes with toast "Payment recorded. Receipt sent to..."
   - Row updates to Paid with date and method shown
   - Summary cards update
   - Check Supabase: payment_status = 'paid', payment_date and payment_method set
   - Check your email: receipt arrived, looks correct, shows right amounts

5. Date range filter: set a range that excludes the booking — confirm it
   disappears. Expand range — confirm it reappears.

6. Status filter: Outstanding → only unpaid. Paid → only paid.

7. The existing Bookings tab still works: Confirm/Cancel still function,
   no regressions.

When all pass:
git add .
git commit -m "feat: payment tracking + accounts tab + receipt emails"
git push

Then:
- Go to Netlify → booking site → Trigger deploy without cache
- Test live: submit a booking, mark it paid, check receipt email
- Confirm Supabase shows payment fields correctly

Report any failures with the exact error and I'll fix before you commit.
```

---

## CONTEXT HANDOFF PROMPT

```
I'm adding payment tracking to my auto-booking project (React + Vite + Tailwind,
Netlify Functions, Supabase bookings table, Resend). The feature adds:
- price_kyd to each service in companyConfig + server-side price lookup in submit-booking.js
- PriceBadge on the booking form step 1
- admin-pay.js Netlify function (password-gated, updates payment fields, sends receipt)
- Accounts tab in /admin with AccountsSummary, PaymentRow, PayModal, AccountsTab
- KYD primary + USD secondary (1 KYD = 0.82 USD fixed rate)
- Date range + payment status filters

Prompts done: [LIST]
Current issue / next step: [DESCRIBE]
Last npm run build: [PASTE]

Read CLAUDE.md and continue.
```
