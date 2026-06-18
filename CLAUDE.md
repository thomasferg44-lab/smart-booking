# CLAUDE.md — Client CRM Feature

Read this fully before writing any code. This is an ADDITION to the existing
`auto-booking` project. It adds a **Clients tab** to the `/admin` dashboard
alongside the existing Bookings and Accounts tabs. Do not modify the booking
form, the calendar sync, the payments flow, or break any existing tabs.

---

## What we are building

A lightweight CRM that turns the booking tool into a real client-management
platform. The owner gets one record per unique client email, built AUTOMATICALLY
from existing bookings — no manual data entry ever.

### The Clients tab shows

1. **Searchable client list** — one row per unique client email. Each row shows:
   name, total bookings, lifetime spend (KYD), outstanding balance, last booking
   date, and any owner tags.

2. **Client detail panel** (click a row) showing:
   - Contact: name, email, phone (from their most recent booking)
   - Stats: total bookings, lifetime value (sum of paid), outstanding (confirmed
     but unpaid), first booking date, last booking date
   - **Booking history** — every booking, newest first: date, category, option,
     price KYD, status, payment status
   - **Owner notes** — private free-text field, editable inline, persisted
   - **Tags** — simple labels (e.g. "VIP", "Regular", "Trial") owner can add/remove

---

## Architecture (critical — read this)

**Client records are DERIVED, not stored.** The CRM groups existing `bookings`
rows by `email` — so every client automatically exists the moment they book.
No duplicate data, no sync issues, always accurate.

The `bookings` table already has these fields from the adaptive engine (Prompt E):
  `category_id`, `category_label`, `option_id`, `option_name`, `booking_mode`,
  `price_kyd`, `duration_minutes`, `selected_weeks`, `level`, `requested_date`,
  `time_slot`, `status`, `payment_status`, `calendar_event_id`

Use `category_label` + `option_name` for display (not the old `service` field,
though `service` still exists as a fallback — prefer the new fields).

The ONLY new stored data is owner notes + tags, in a new `clients` table:
  - `email` (primary key)
  - `notes` (text)
  - `tags` (text[] array)
  - `updated_at`

That's the entire new schema. The SQL is in `crm-setup.sql`.

---

## Hard rules (same as all DropStack builds)

1. **Branch + PR.** Work on `feat/client-crm`. Do NOT push to main.
2. **Thomas handles all outward-facing steps** — deploys, live tests.
3. **Flag every deviation** from prompt scope (CLAUDE rule 3).
4. **Never commit secrets.**
5. **Don't break what works** — Bookings tab, Accounts tab, payments, calendar
   sync, booking form must all keep working.
6. **Match existing patterns** — mirror how Dashboard.jsx, AccountsSummary,
   BookingCard, and the admin Netlify functions are structured.
7. **Drive colors from CSS variable tokens** — no hardcoded brand colors.
   The CRM tab must look native to the existing admin UI.

---

## Definition of done

- `npm run build` zero errors.
- Playwright suite passes, no regressions.
- Clients tab appears in admin nav alongside Bookings and Accounts.
- Every booker auto-appears as a client row.
- Client detail panel shows correct aggregated stats + full booking history.
- Notes and tags persist via Supabase.
- Everything on `feat/client-crm` as an open PR for Thomas to merge.
