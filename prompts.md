# PROMPTS.md — Client CRM (P1 → P5)

Run these in Claude Code one at a time, in order. Wait for each to finish,
review the summary, then run the next.

Before P1: CLAUDE.md is in the project root.
Before P4: crm-setup.sql has been run in Supabase.

---

## Prompt 1 — admin-clients Netlify function

```
Read CLAUDE.md first and follow all its rules. Work on branch feat/client-crm.

Build the server-side data layer for the CRM. Create a new Netlify function:
netlify/functions/admin-clients.js

It must be authenticated the same way as the existing admin functions (check how
admin-update.js and admin-pay.js authenticate — mirror that pattern exactly).

The function aggregates one client record per unique email from the bookings
table. For each unique email, return:

  email         — the client's email
  name          — from their most recent booking
  phone         — from their most recent booking
  totalBookings — count of all their bookings
  lifetimeValue — sum of price_kyd where payment_status = 'paid'
  outstanding   — sum of price_kyd where status = 'confirmed'
                  AND payment_status != 'paid'
  firstBooking  — earliest created_at
  lastBooking   — most recent created_at
  tags          — from the clients table (empty array if no record yet)
  notes         — from the clients table (null if no record yet)

JOIN the clients table (LEFT JOIN on email) to include notes + tags.

Use category_label + option_name for any booking display fields (these come from
the adaptive engine). Fall back to the existing `service` column if both are
null (for any legacy rows).

Sort results by lastBooking DESC (most recently active clients first).

Also add a query param `?email=` that returns the FULL booking history for one
client — all their bookings, newest first, with: id, created_at, category_label,
option_name, service (fallback), requested_date, time_slot, selected_weeks,
level, booking_mode, status, payment_status, price_kyd, calendar_event_id.

Then:
- npm run build must pass, function must bundle cleanly.
- Stay on feat/client-crm.
- Summarize changes and flag deviations.
```

---

## Prompt 2 — admin-client-note Netlify function

```
Read CLAUDE.md first and follow all its rules. Stay on feat/client-crm.

Build the notes + tags persistence layer. Create:
netlify/functions/admin-client-note.js

Authenticated the same way as the other admin functions.

POST body: { email, notes?, tags? }
  - Upserts a row in the clients table (insert if no record, update if exists).
  - Only updates the fields provided (notes and tags are independent — sending
    just tags should not wipe notes).
  - Sets updated_at = now().
  - Returns { success: true, email, notes, tags }.

Validation:
  - email is required and must be a non-empty string.
  - tags must be an array of strings if provided (max 10 tags, each max 30 chars).
  - notes max 2000 characters.
  - Return clear 400 errors for invalid input.

Then:
- npm run build must pass.
- Summarize and flag deviations.
```

---

## Prompt 3 — Clients tab + searchable list

```
Read CLAUDE.md first and follow all its rules. Stay on feat/client-crm.

Build the Clients tab UI. This is a React component that lives in the admin
dashboard alongside the existing Bookings and Accounts tabs.

Requirements:

1. Add "Clients" to the existing tab navigation in Dashboard.jsx (or wherever
   the Bookings/Accounts tabs live — check the existing structure and match it
   exactly, don't restructure the nav).

2. Create src/admin/ClientsTab.jsx. On mount, fetch from admin-clients. Show:
   - A search bar that filters the list by name or email (client-side filter).
   - A summary strip at the top: total clients, total lifetime value (KYD),
     total outstanding (KYD) — styled consistently with the Accounts summary.
   - A list of client rows. Each row shows:
       • Client name + email
       • Total bookings (small badge)
       • Lifetime value KYD
       • Outstanding KYD (if > 0, highlight in the brand accent color)
       • Last booking date (relative: "2 days ago", "Today", etc.)
       • Tags (small pills, up to 3 shown, "+N more" if more)
       • A chevron → indicating it's clickable
   - Clicking a row opens the detail panel (built in P4 — for now just set a
     selectedClient state and render a placeholder "Detail coming in P4").
   - Empty state: if no clients yet, show a calm message ("No bookings yet —
     clients will appear here automatically once bookings come in.").
   - Loading and error states consistent with existing admin UI.

3. Design must feel native to the existing admin dashboard:
   - Use the same CSS variable tokens (--color-primary, etc.)
   - Match the card/row style of BookingCard.jsx
   - Mobile-first, no overflow issues
   - No hardcoded colors

Then:
- npm run build must pass, Playwright must pass (no regressions).
- Summarize and flag deviations.
```

---

## Prompt 4 — Client detail panel

```
Read CLAUDE.md first and follow all its rules. Stay on feat/client-crm.
Confirm crm-setup.sql has been run in Supabase before testing notes/tags.

Build the client detail panel that opens when a client row is clicked.

Create src/admin/ClientDetail.jsx. It receives the selected client object
(from the list) and fetches their full booking history via admin-clients?email=.

Show:

1. HEADER — name, email, phone, first seen / last seen dates.
   A back button / close that returns to the client list.

2. STATS ROW — 4 cards: Total Bookings · Lifetime Value (KYD) · Outstanding (KYD)
   · Member Since. Styled like the Accounts summary cards.

3. BOOKING HISTORY — a clean list of all their bookings, newest first.
   Each row: date, category + option (use category_label / option_name, fall back
   to service), price KYD, status pill, payment status pill.
   For weeks bookings, show selected weeks. For level bookings, show the level.
   Show a 📅 icon if calendar_event_id is set.

4. OWNER NOTES — a textarea the owner can type in. Auto-saves on blur (calls
   admin-client-note). Show a subtle "Saved" confirmation. Max 2000 chars,
   show a character count.

5. TAGS — display existing tags as removable pills. An input to add a new tag
   (press Enter or comma to add). Each tag has an ✕ to remove. Saves immediately
   on change via admin-client-note. Max 10 tags.

Implementation notes:
  - Notes and tags save independently — editing notes doesn't reset tags.
  - If the client has no record in the clients table yet, notes is empty and
    tags is []. First save creates the record.
  - All saves are non-blocking (don't block the UI while saving).
  - Show a subtle error if a save fails.
  - Design must match the admin UI — same tokens, same card style, mobile-first.

Then:
- npm run build must pass, Playwright must pass.
- Summarize and flag deviations.
```

---

## Prompt 5 — Final check, branch + PR

```
Read CLAUDE.md first and follow all its rules.

Finalize the CRM feature for Thomas's live pass.

1. npm run build — zero errors.
2. Playwright suite — no regressions. Fix any broken selectors from the new
   Clients tab being added to the nav (this is in scope for P5).
3. Confirm all four admin functions bundle cleanly:
   admin-update, admin-pay, admin-clients, admin-client-note.
4. Confirm no secrets committed, .gitignore still clean.
5. Commit everything to feat/client-crm and open a PR. Do NOT merge or deploy.

Then produce a MANUAL CHECKLIST for Thomas:
  - Run crm-setup.sql in Supabase (if not already done)
  - Merge PR → Netlify deploys
  - Open /admin → Clients tab appears
  - Click a client → detail panel opens, stats correct
  - Write a note → blurs → "Saved" appears → refresh → note persists
  - Add a tag → saves immediately → refresh → tag persists
  - Confirm no regressions on Bookings and Accounts tabs

Summarize the final state of the feature.
```
