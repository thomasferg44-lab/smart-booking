# CLAUDE.md — Calendar Sync Feature

**Read this fully before running any prompt.** It defines what we're building, the decisions already made, and the rules you must follow.

---

## What we're building

Automatic calendar sync for the **Smart Booking Tool** (`auto-booking`). When a booking's status changes to **`confirmed`** in the admin dashboard, two things happen:

1. **Business calendar** — the event is inserted into the business owner's Google Calendar via a **service account**.
2. **Customer calendar** — the customer is emailed a **`.ics` attachment** through the existing **Resend** integration, so the event lands in their own calendar (Apple/Google/Outlook).

This lives in the **main project** so every client inherits it. Per-client values come from `companyConfig` and are set later in **Prompt C**.

---

## Decisions already made — do NOT relitigate these

| Decision | Choice | Why |
|---|---|---|
| **Trigger** | Booking status → `confirmed` only | Not on submit, not on payment. Payment is a separate concern. |
| **Customer invite method** | `.ics` via Resend (NOT Google attendee invites) | Service accounts on non-Workspace Gmail calendars silently fail to send attendee emails. `.ics` works for every client regardless of their Google plan. |
| **Event model** | **Option A** — one event per booking | A camp signup creates its own event. No "attach attendee to an existing group event" logic. Simple, works for every service type (lessons, camps, cleaning, etc.). |
| **Event duration** | Matches the service's `durationMinutes` | Different services have different lengths. Duration is read **server-side** from a trusted map, never from the client. |
| **Event title** | `{service name} — {customer name}` | e.g. `Private lesson (1hr) — Bella Janke` |
| **Timezone** | Per-client `companyConfig.timezone`, default `America/Cayman` | Cayman is UTC−5 year-round, no daylight saving. |
| **Cancellation/reschedule sync** | **Out of scope for v1** | We store the event ID now so this can be added later, but we do not delete/patch events yet. |

---

## Architecture: env vars vs. companyConfig

This distinction is critical — get it right.

**Env vars (Netlify) — shared across ALL clients, these are DropStack's credentials:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — the service account's `client_email`
- `GOOGLE_PRIVATE_KEY` — the service account's `private_key` (contains escaped `\n`; convert with `.replace(/\\n/g, '\n')` before use)
- `RESEND_API_KEY` — already exists, reuse it

**companyConfig (per deployment) — different for each client, set in Prompt C:**
- `calendarId` — which calendar to write to (placeholder in P1)
- `timezone` — IANA name, default `'America/Cayman'`
- `durationMinutes` — added to each service object

---

## Hard rules for every prompt

1. **Branch + PR workflow.** Work on a feature branch (`feat/calendar-sync`). Do **not** push to `main`. Open a PR; Thomas merges.
2. **Thomas handles all outward-facing steps himself** — real emails, Netlify env vars, deploys, and live end-to-end tests. Do not attempt to send real emails, deploy, or trigger live calendar writes on his behalf during the build. Where a step needs that, stop and hand it to him with clear instructions.
3. **Flag every deviation.** If you must touch a file outside the stated scope of a prompt (like the test regression from the payments build), do it only if the build would otherwise break, and call it out explicitly in your summary.
4. **Never commit secrets.** The Google JSON key, `.env` files, and any private key must never be committed. Confirm `.gitignore` covers `.env*` and any key files.
5. **Non-blocking calendar failures.** If a calendar write or `.ics` email fails, the booking confirmation must still succeed. Log the error, surface a non-blocking warning in the admin UI, but never let a calendar failure roll back or block the confirmation.
6. **Idempotency.** Never create a duplicate calendar event. Only create one when status becomes `confirmed` **and** `calendar_event_id` is currently null. If an event ID already exists, skip.
7. **Don't break what works.** The booking form, the payment-tracking feature (just shipped), and the existing confirm flow must all keep working. Preserve existing behavior; add to it.
8. **Match existing patterns.** Mirror the structure already in the repo (how the payment `PRICES` server-side map was done, how Netlify functions and the email/Resend code are organized, how `companyConfig` is shaped).

---

## Tech context

- **Stack:** React + Vite + Tailwind front end; **Netlify Functions** as the secure backend proxy; **Supabase** for data; **Resend** for email.
- **Booking statuses** already exist: `pending`, `confirmed`, `cancelled`. The confirm action is the existing transition to `confirmed` — hook into it, don't invent a new one.
- **`bookings` table** gets two new columns from `calendar-setup.sql`: `calendar_event_id` (text) and `calendar_synced_at` (timestamptz).
- **Google API:** use the official `googleapis` (or `google-auth-library` + `googleapis`) Node package with **JWT service-account auth**, scope `https://www.googleapis.com/auth/calendar`.

---

## Definition of done (for the whole kit)

- `npm run build` passes with zero errors.
- Existing Playwright suite passes (no regressions).
- A confirmed booking writes an event to the business calendar and stores its `calendar_event_id`.
- The customer receives a valid `.ics` invite via Resend.
- A calendar/email failure never blocks confirmation.
- Everything is on `feat/calendar-sync` as an open PR for Thomas to merge.
