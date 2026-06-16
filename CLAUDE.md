# CLAUDE.md — Payment Tracking Feature

Read this fully before writing any code. This is an ADDITION to the existing `auto-booking` project. The booking form, submit-booking.js, and the existing /admin dashboard all stay intact. We are adding payment tracking on top.

---

## What we are building

A payment tracking layer that turns the booking tool into a lightweight accounting tool for the business owner. It adds:

1. **Price per service** — each service in `companyConfig.js` gets a default KYD price. The booking form shows the client what they'll pay. The owner can override the price per booking in the dashboard.
2. **Accounts tab** — a second tab inside `/admin` alongside the existing Bookings tab. Shows a summary row (Total Owed / Paid / Outstanding in KYD + USD) and a full per-booking breakdown with payment status.
3. **Mark as Paid** — owner clicks Paid on any booking, a modal asks for date received and payment method (Cash / Bank Transfer / Other), saves to Supabase, and fires a receipt email to the client via Resend.
4. **Filters** — date range + payment status (All / Paid / Outstanding) in the Accounts tab.
5. **Receipt email** — branded, sent to the client when marked paid.

---

## Existing stack — match it exactly
- React 18 + Vite + Tailwind CSS v3
- Netlify Functions (all Supabase access server-side only — service key NEVER in frontend)
- Supabase — `bookings` table already exists
- Resend — already configured
- companyConfig.js — source of truth for services, branding, pricing

---

## Database changes (new columns on bookings table)

```sql
price_kyd       numeric(10,2)   -- lesson price in KYD, set from companyConfig on submit
payment_status  text            -- 'unpaid' | 'paid', default 'unpaid'
payment_date    date            -- date payment was received (set when marked paid)
payment_method  text            -- 'cash' | 'bank_transfer' | 'other' (set when marked paid)
```

Run `supabase-payments-setup.sql` once before building.

---

## Currency
- KYD is primary. USD is shown secondary.
- Fixed rate: 1 KYD = 0.82 USD (standard Cayman peg — close enough for a small business tool).
- Format: `KYD $75.00 (USD $61.50)`
- All storage is in KYD. USD is display-only, calculated on the fly.

---

## New files this kit adds

```
auto-booking/
├── companyConfig.js              ← ADD prices to each service (existing file)
├── src/
│   ├── components/
│   │   └── PriceBadge.jsx        ← shows price on booking form step 1
│   ├── admin/
│   │   ├── AdminApp.jsx          ← ADD tab navigation (Bookings | Accounts)
│   │   ├── AccountsTab.jsx       ← NEW: summary + full breakdown
│   │   ├── AccountsSummary.jsx   ← NEW: 3 stat cards (owed/paid/outstanding)
│   │   ├── PaymentRow.jsx        ← NEW: one booking row in the accounts view
│   │   └── PayModal.jsx          ← NEW: mark-as-paid modal (date + method)
├── netlify/functions/
│   ├── admin-pay.js              ← NEW: password-gated, updates payment fields + sends receipt
│   └── (existing functions untouched)
└── supabase-payments-setup.sql   ← run once
```

---

## Security rules (same as existing dashboard)
- Service key and Resend key NEVER in frontend code
- `admin-pay.js` checks `process.env.ADMIN_PASSWORD` before doing anything
- Frontend sends { password, bookingId, paymentDate, paymentMethod } to admin-pay

---

## The receipt email
Branded, simple. Subject: "Payment received — [service] on [date]". Shows: student name, service, lesson date/time, amount paid in KYD + USD, payment method, booking reference. From: `bookings@dropstack.co`. Matches the existing email style in submit-booking.js.

---

## Non-negotiable rules
1. Never put Supabase service key or admin password in frontend code.
2. Do not modify submit-booking.js or the booking form flow — only ADD.
3. The price shown to the client on the booking form is read-only (from companyConfig) — they cannot change it.
4. Match existing code style exactly.
5. `npm run build` passes with zero errors after every prompt.
6. One prompt at a time. Test. Then continue.

---

## Definition of done
- [ ] companyConfig.js has prices for every service
- [ ] Booking form shows price on step 1 (service selection)
- [ ] New bookings save price_kyd to Supabase on submit
- [ ] /admin has Bookings and Accounts tabs
- [ ] Accounts tab shows summary + full breakdown
- [ ] Date range and payment status filters work
- [ ] Mark as Paid modal captures date + method and saves
- [ ] Receipt email fires to client on marking paid
- [ ] KYD primary + USD secondary shown throughout
- [ ] npm run build passes, deployed to Netlify
