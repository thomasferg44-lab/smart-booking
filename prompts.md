# PROMPTS.md — Calendar Sync (P1 → P5)

Run these in Claude Code **one at a time, in order**. Wait for each to finish, review the summary, then run the next. Each prompt is a copy-paste block between the lines.

> Before P1: make sure `CLAUDE.md` is in the project root so Claude Code reads the shared context and rules.
> Before P4: make sure you've run `calendar-setup.sql` in Supabase.

---

## Prompt 1 — Foundation: config + service durations

```
Read CLAUDE.md first and follow all its rules.

We are starting the Calendar Sync feature. This first prompt only sets up
configuration and data shape — do NOT add any Google Calendar code yet.

Do this:

1. In companyConfig.js:
   - Add a `durationMinutes` field to every service object. Use these
     PLACEHOLDER values for now (real values are set later in Prompt C):
       • 60-min services → 60
       • 30-min services → 30
       • anything ambiguous → 60
   - Add a top-level `timezone: 'America/Cayman'` field with a comment that
     Prompt C may override it per client.
   - Add a top-level `calendarId: ''` field with a comment:
     "// Set in Prompt C — the Google Calendar ID to write confirmed bookings to".

2. Create a trusted SERVER-SIDE durations map (mirroring how the payments
   PRICES map was done) so the event duration can never be set by the client.
   Put it wherever the confirm/booking server logic will later read it.
   Map each service name to its durationMinutes.

3. Do NOT wire any calendar logic, do NOT touch the booking submission flow,
   and do NOT send anything. This prompt is config + map only.

Then:
- Confirm `npm run build` passes.
- Confirm the service dropdown and the PriceBadge still render correctly
  (adding a third field to each service object must not break them — verify).
- Work on a branch `feat/calendar-sync`. Do not push to main.
- Summarize exactly what you changed and flag any deviation from this scope.
```

---

## Prompt 2 — Google Calendar module (auth + insert helper)

```
Read CLAUDE.md first and follow all its rules.

Build the reusable Google Calendar module. This prompt creates the helper
ONLY — do not wire it into the booking flow yet.

Do this:

1. Install the official Google API client (`googleapis`).

2. Create a shared server-side module (place it consistently with the existing
   Netlify Functions structure, e.g. netlify/functions/_shared/google-calendar.js).
   It must export an async function, e.g.:

     createCalendarEvent({
       calendarId,        // string, from companyConfig
       summary,           // event title
       description,       // event details
       startISO,          // event start (ISO string in the business timezone)
       durationMinutes,   // number
       timezone,          // IANA name, e.g. 'America/Cayman'
       location           // optional string
     }) -> returns the created Google event's id

   Implementation requirements:
   - Authenticate with a service-account JWT built from env vars
     GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY, scope
     'https://www.googleapis.com/auth/calendar'.
   - IMPORTANT: GOOGLE_PRIVATE_KEY arrives with escaped newlines. Convert with
     .replace(/\\n/g, '\n') before use. Add a clear comment so this isn't lost.
   - Compute the event end time from startISO + durationMinutes.
   - Set start/end with the provided `timezone`.
   - Do NOT add the customer as a Google attendee (we email a .ics separately —
     see CLAUDE.md). Put the customer's details in the description instead.
   - Throw a clear, descriptive error on failure (the caller will catch it).

3. Create a small, clearly-named TEST Netlify function (e.g. test-calendar.js)
   that calls createCalendarEvent with hardcoded sample data, so Thomas can hit
   it once to confirm a real event lands on the calendar. Add a comment at the
   top: "TEMPORARY — for manual testing only. Remove before final merge."
   Do NOT call it yourself; Thomas will trigger it (it's an outward-facing step).

Then:
- Confirm `npm run build` passes and the functions bundle includes the new files.
- Stay on branch `feat/calendar-sync`.
- Summarize changes, list the exact env vars required, and flag deviations.
```

---

## Prompt 3 — `.ics` invite + Resend customer email

```
Read CLAUDE.md first and follow all its rules.

Build the customer-side calendar invite. This prompt creates the .ics builder
and the email-send capability ONLY — wiring into the confirm flow happens in P4.

Do this:

1. Create a server-side utility that builds a valid .ics (iCalendar) string for
   a single VEVENT. Inputs: summary, description, startISO, durationMinutes,
   timezone, location, a unique UID, and an organizer name/email.
   Requirements:
   - Produce a standards-compliant VCALENDAR/VEVENT (VERSION:2.0, PRODID, UID,
     DTSTAMP, DTSTART, DTEND, SUMMARY, DESCRIPTION, LOCATION).
   - Handle the timezone correctly so the event shows at the right local time
     for the customer. (Cayman is UTC−5 with no DST; emitting times as UTC `Z`
     computed from the business timezone is acceptable and unambiguous for v1.)
   - Escape commas, semicolons, and newlines per the iCal spec.

2. Extend the existing Resend email code (reuse RESEND_API_KEY and the existing
   from-address) to send the customer an email with the .ics attached, named
   like `booking.ics`, with a friendly subject and short body confirming the
   booking. Mirror the structure of the existing receipt email so styling and
   sender stay consistent.

3. Do NOT wire this into the confirm flow yet. Expose it as a clean function the
   P4 integration can call. Do not send any real email yourself — Thomas runs
   outward-facing tests.

Then:
- Confirm `npm run build` passes.
- Stay on branch `feat/calendar-sync`.
- Summarize changes and flag deviations.
```

---

## Prompt 4 — Wire both into the confirm flow

```
Read CLAUDE.md first and follow all its rules.
Confirm calendar-setup.sql has been run in Supabase before relying on the new
columns (calendar_event_id, calendar_synced_at).

This is the integration step. Hook calendar sync into the existing action that
sets a booking's status to `confirmed`.

Do this:

1. Locate the existing server-side handler that transitions a booking to
   `confirmed` (the admin confirm action). Do not create a new status — use the
   existing one.

2. When a booking becomes `confirmed` AND its calendar_event_id is null:
   a. Read the service's duration from the trusted server-side durations map
      (from P1) — never from client input.
   b. Build the event title as `{service name} — {customer name}` and a
      description containing customer name, email, phone (if present), service,
      and price.
   c. Call createCalendarEvent (P2) using companyConfig.calendarId and
      companyConfig.timezone. On success, write the returned event id to
      bookings.calendar_event_id and set calendar_synced_at = now().
   d. Build the .ics and email it to the customer via the P3 function.

3. Resilience (critical — see CLAUDE.md rule 5):
   - The confirmation must succeed even if the calendar write or the email fails.
   - Wrap calendar + email in try/catch. On failure, log a clear error and
     return a non-blocking warning to the admin UI; do NOT roll back the
     confirmation.
   - Idempotency: if calendar_event_id already exists, skip creation entirely.

4. Admin UI: on confirmed rows that synced successfully, show a small, quiet
   indicator (e.g. a 📅 icon or "Synced" pill) consistent with the existing
   dashboard styling. If sync failed, show a subtle warning state instead.

Then:
- Confirm `npm run build` passes.
- Stay on branch `feat/calendar-sync`.
- Summarize changes, describe the failure-handling behavior, and flag deviations.
```

---

## Prompt 5 — Test, no-regressions, branch + PR

```
Read CLAUDE.md first and follow all its rules.

Finalize the feature for Thomas's live pass.

Do this:

1. Run `npm run build` — confirm zero errors.
2. Run the existing Playwright suite — confirm no regressions. If the P1 config
   shape change broke any tests, fix them now (this is the "no regressions"
   step where test fixes are in scope).
3. Confirm the functions bundle includes the calendar module, the .ics/email
   code, and the confirm handler.
4. Remove or clearly neutralize the temporary test-calendar.js function from P2
   so it doesn't ship as a live endpoint (or leave it but gate it behind an env
   flag — your call, state which you did).
5. Confirm no secrets are committed and `.gitignore` covers `.env*` and any key
   files.
6. Commit everything to `feat/calendar-sync` and open a PR. Do NOT merge and do
   NOT deploy — Thomas does that.

Then produce a MANUAL CHECKLIST for Thomas covering the live pass:
   - Env vars set in Netlify (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY)
   - Dad's calendar shared with the service account email
   - companyConfig.calendarId + timezone set (or note these come in Prompt C)
   - Merge PR → deploy → confirm a test booking → verify event on the calendar,
     .ics in the customer inbox, and calendar_event_id populated in Supabase.

Summarize the final state and list anything still pending on Thomas's side.
```

---

## After P5
Tell me the build is done and we'll do the live pass together, then onboard the swim academy via Prompt C.
