# CLAUDE.md — Admin Dashboard for Smart Booking

Read this file at the start of every session. Follow it exactly. Do not skip steps.

---

## What we are building

An **owner/admin dashboard** that gets added to the EXISTING `auto-booking` project. It lets the business owner log in with a password and see, search, and manage every booking that comes through the booking form. No Supabase login, no Netlify login — they open one clean URL, type a password, and manage their bookings.

This is the piece that makes the booking tool actually sellable. Without it, bookings just sit in a database the owner can't see.

### The three things the dashboard must do
1. **Show every booking** — pulled live from Supabase, newest first.
2. **Let the owner change a booking's status** — Confirm or Cancel, with the change saved instantly.
3. **Let the owner find a booking fast** — search by name/email, filter by status, see this-week stats at a glance.

---

## Where this fits — DO NOT rebuild the project

This is an ADDITION to the existing `auto-booking` repo. The booking form, the Supabase `bookings` table, the `submit-booking.js` function, and `companyConfig.js` already exist and work. Do not touch the booking form flow. Only ADD the admin pieces described in PROMPTS.md.

### Existing stack (already in place — match it exactly)
- **React 18 + Vite + Tailwind CSS v3** — frontend
- **Netlify Functions** — secure backend (Supabase service key lives ONLY here, never frontend)
- **Supabase** — the `bookings` table already exists
- **react-router-dom** — may need installing if not present; the admin lives at `/admin`

### The existing `bookings` table columns
```
id              uuid (primary key)
name            text
email           text
phone           text
service         text
requested_date  date
requested_time  text
intake_data     jsonb
notes           text
status          text   ('pending' | 'confirmed' | 'cancelled')
created_at      timestamptz
```

---

## Security model — read this carefully, it is the most important part

The Supabase **service role key** must NEVER appear in frontend code. It already lives safely inside Netlify Functions. The dashboard follows the same rule.

- The frontend NEVER talks to Supabase directly.
- The frontend calls two NEW Netlify Functions: `admin-bookings.js` (read) and `admin-update.js` (write).
- Every admin function checks a password against `process.env.ADMIN_PASSWORD` before doing anything. Wrong password → 401, return nothing.
- The password is sent in the request body over HTTPS, never stored in the URL.
- The frontend keeps the password only in React state + `sessionStorage` (cleared when the tab closes), never in code.

This is not bank-grade auth and does not need to be — it is a single-owner gate for a small business tool. But the service key staying server-side is non-negotiable.

---

## Non-negotiable rules
1. **Never put the Supabase service key or the admin password in frontend code.** Functions read them from `process.env.*`.
2. **Do not modify the existing booking form or `submit-booking.js`.** Add, don't edit.
3. **The white-label layer stays `companyConfig.js`.** The dashboard pulls the brand name and accent colour from there so it auto-brands per client.
4. **Match the existing code style** — same React patterns, same Tailwind setup, same function structure as `submit-booking.js`.
5. **After every prompt, run `npm run build` and confirm zero errors before moving on.**
6. **One prompt at a time. Wait for it to finish. Test. Then continue.**

---

## New file structure this kit adds
```
auto-booking/
├── src/
│   ├── admin/
│   │   ├── AdminApp.jsx          ← route guard + password gate + layout
│   │   ├── LoginGate.jsx         ← the frosted password screen
│   │   ├── Dashboard.jsx         ← stats row + bookings table/list
│   │   ├── BookingCard.jsx       ← one booking, expandable, with actions
│   │   ├── StatusPill.jsx        ← colour-coded status chip
│   │   └── adminTheme.js         ← reads companyConfig, exposes accent tokens
│   └── (existing files untouched)
├── netlify/functions/
│   ├── admin-bookings.js         ← NEW: password-gated read
│   ├── admin-update.js           ← NEW: password-gated status update
│   └── (existing submit-booking.js untouched)
└── DESIGN-BRIEF.md               ← the look + feel spec (follow it exactly)
```

---

## The look: read DESIGN-BRIEF.md before writing any UI

The owner judges whether this is "real software" in the first two seconds of seeing it. It must look like it was made by a serious product studio. `DESIGN-BRIEF.md` in this kit is the exact spec — palette, type, spacing, motion, the signature element. Follow it. When you build any screen, take a screenshot, compare it against the brief, and refine until it matches. Do at least two refinement passes on the dashboard before calling it done.

---

## Environment variables this kit adds (set in Netlify + local .env)
```
ADMIN_PASSWORD=            ← the owner's dashboard password (you set this per client)
```
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` already exist from the booking tool — the admin functions reuse them.

---

## Definition of done
- [ ] `/admin` shows a branded password screen
- [ ] Correct password loads the dashboard; wrong password is rejected
- [ ] All bookings load, newest first, with live data
- [ ] Search by name/email works
- [ ] Filter by status (All / Pending / Confirmed / Cancelled) works
- [ ] Confirm and Cancel buttons update the booking and the change persists on refresh
- [ ] Stats row shows total, pending, and this-week counts
- [ ] The UI matches DESIGN-BRIEF.md and looks genuinely high-end
- [ ] `npm run build` passes with zero errors
- [ ] Deployed to Netlify with `ADMIN_PASSWORD` set
