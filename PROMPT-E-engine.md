# PROMPT E — Adaptive Booking Engine + Premium Redesign

**Run this FIRST. It is the biggest of the three. Run it in your existing `~/auto-booking` project on a new branch.**

This prompt rebuilds the booking experience into a **config-driven, multi-category adaptive engine** and gives it a premium visual design. It does NOT hardcode any one client's services — everything is driven by `companyConfig` so the same engine powers your dad's deploy and the DropStack demo deploy.

---

## Copy everything below into Claude Code

```
Read CLAUDE.md first and follow all its rules (branch + PR workflow, flag
deviations, non-blocking calendar failures, never commit secrets, Thomas runs
all outward-facing steps).

We are upgrading the Smart Booking Tool from a single-dropdown form into a
config-driven, multi-category ADAPTIVE BOOKING ENGINE with a premium redesign.
This is shared engine code — do NOT hardcode any specific business's services.
Everything is driven by companyConfig so different deployments feed it different
data. Work on a new branch: feat/booking-engine.

=== PART 1: THE CONFIG SCHEMA ===

Redesign companyConfig.js so `services` becomes a richer structure that supports
CATEGORIES, each containing OPTIONS, and each category declaring how it books.

Define this shape (use placeholder/sample data for now — real data comes from
Prompt T and Prompt C later):

services: [
  {
    id: 'private-lessons',
    label: 'Private Lessons',
    blurb: 'One-on-one coaching, you pick the time.',
    bookingMode: 'datetime',     // customer picks date + time
    options: [
      { id: 'p-1c-30', name: '1 child · 30 min', price: 50, durationMinutes: 30 },
      { id: 'p-1c-60', name: '1 child · 1 hr',   price: 100, durationMinutes: 60 },
      // ...
    ]
  },
  {
    id: 'swim-team',
    label: 'Swim Team',
    blurb: 'Weekly squad training. Fixed schedule.',
    bookingMode: 'fixed',        // no date/time entry; schedule is shown as info
    scheduleNote: 'Saturdays (1 hr) and Wednesdays (30 min).',
    options: [
      { id: 'st-sat-single', name: 'Saturday class (1 hr)', price: 35, durationMinutes: 60 },
      { id: 'st-sat-8',      name: 'Saturday · 8-class pack', price: 240, durationMinutes: 60, isPackage: true, packageCount: 8 },
      // ...
    ]
  },
  {
    id: 'summer-camp',
    label: 'Summer Camp',
    blurb: 'Pick the weeks that work for you.',
    bookingMode: 'weeks',        // customer selects one or more weeks
    weekOptions: [               // the selectable weeks (sample; real ones in Prompt C)
      { id: 'wk1', label: 'Week 1' }
    ],
    options: [
      { id: 'sc-dropin', name: 'Drop-in (per day)', price: 65, durationMinutes: 180 },
      { id: 'sc-1wk',    name: '1 week (Mon–Fri, 9:30–12:30)', price: 300, durationMinutes: 180 },
      // ...
    ],
    discountNote: '' // optional note shown under the category
  },
  {
    id: 'water-polo',
    label: 'Water Polo',
    blurb: 'Fixed weekly sessions.',
    bookingMode: 'fixed',
    scheduleNote: 'Tue–Fri, 4:00–6:30 PM.',
    options: [
      { id: 'wp-session', name: 'Per session', price: 25, durationMinutes: 150 },
      { id: 'wp-chukka',  name: 'Per chukka (every 2 months)', price: 400, durationMinutes: 150, isPackage: true }
    ]
  },
  {
    id: 'splash-ball',
    label: 'Splash Ball',
    blurb: 'Choose your level.',
    bookingMode: 'level',        // customer self-selects a sub-group (level), then an option
    levels: [
      { id: 'sb1', label: 'Splash Ball 1', scheduleNote: 'Tue/Thu 3:30–4:00',
        options: [
          { id: 'sb1-session', name: 'Per session', price: 15, durationMinutes: 30 },
          { id: 'sb1-chukka',  name: 'Per chukka', price: 200, durationMinutes: 30, isPackage: true }
        ] },
      { id: 'sb2', label: 'Splash Ball 2', scheduleNote: 'Tue/Thu 3:30–5:00',
        options: [
          { id: 'sb2-session', name: 'Per session', price: 20, durationMinutes: 90 },
          { id: 'sb2-chukka',  name: 'Per chukka', price: 300, durationMinutes: 90, isPackage: true }
        ] }
    ]
  }
]

Keep top-level companyConfig fields too: companyName, timezone, calendarId,
currency ('KYD'), usdRate (the existing KYD→USD rate already used by PriceBadge),
brand colors, ownerEmail, phone, location, etc. Preserve existing keys the app
already reads — do NOT remove fields other code depends on; add to them.

The FOUR booking modes the engine must support:
  - 'datetime' → customer picks a date and a time slot (existing behavior)
  - 'fixed'    → no date/time; show scheduleNote as read-only info
  - 'weeks'    → customer ticks one or more weeks from weekOptions
  - 'level'    → customer first picks a level, then an option within that level
    (level itself then behaves like 'fixed' for scheduling)

=== PART 2: THE ADAPTIVE BOOKING FLOW ===

Rebuild the booking form as a clean multi-step flow:

  Step 1 — Choose a category (render the services[] categories as selectable
           cards: label + blurb).
  Step 2 — Choose an option:
             • For 'level' categories, first show the levels, then that level's options.
             • Otherwise show that category's options with name + price badge.
  Step 3 — Adaptive details, driven by the chosen category's bookingMode:
             • datetime → date picker + time slot (as today)
             • fixed    → no scheduling inputs; show scheduleNote clearly
             • weeks    → multi-select checkboxes from weekOptions
             • level    → already chose level in step 2; show its scheduleNote
  Step 4 — Customer details (name, email, phone) — REUSE the existing fields.
           Email remains required (needed for the .ics invite).
  Step 5 — Review & submit: show category, option, price (KYD + USD via the
           existing PriceBadge logic), any selected weeks, and the schedule note.

Keep the existing PriceBadge KYD→USD display. Packages (isPackage) should show
their flat price and a small "paid upfront" tag.

Discounts: if a category or option has a discountNote, show it as a calm inline
note (e.g. "Team members receive a discount — your coach will confirm it on your
invoice."). The form must NEVER calculate or apply discounts — owner does that
manually on the invoice.

=== PART 3: SUBMISSION + DATA ===

Update submit-booking.js and the Supabase insert so a booking records:
  - category id + label
  - option id + name
  - price_kyd (server-side trusted, mirroring the existing PRICES pattern — build
    a server-side lookup from the config so the client can't set its own price)
  - duration_minutes (server-side trusted)
  - booking_mode
  - selected_weeks (nullable, for summer camp)
  - level (nullable, for splash ball)
  - date + time_slot (nullable — only for datetime mode)

If new columns are needed, output a migration file `engine-setup.sql` (additive,
IF NOT EXISTS) for Thomas to run in Supabase. Do not assume columns exist.

=== PART 4: CALENDAR BEHAVIOR PER MODE ===

In the confirm flow (admin-update.js, already wired from the calendar feature):
  - datetime bookings → create a precise timed Google Calendar event (as today)
    using the option's durationMinutes, and send the customer the .ics.
  - fixed / level / weeks bookings → these have no precise instant, so DO NOT
    fabricate a time. Instead create an ALL-DAY calendar event titled
    "{category} — {customer name}" on the booking's created date (or, for weeks,
    on the first selected week's start if available), so the owner sees the
    signup. Skip the customer .ics for non-datetime modes (no precise time to
    send), OR send a confirmation email without an .ics — your call, state which.
  - Preserve all existing rules: non-blocking failure, idempotency
    (calendar_event_id), the "Synced" indicator.

=== PART 5: PREMIUM REDESIGN ===

Elevate the visual design of BOTH the booking form and the /admin dashboard so
it reads as a polished commercial product, not a default form. Requirements:
  - Drive ALL colors from companyConfig brand tokens (primary, accent, etc.) via
    CSS variables — no hardcoded brand colors, so Prompt T and Prompt C just
    swap tokens.
  - Category and option selection should feel like tappable cards with clear
    hover/selected states, generous spacing, and strong typographic hierarchy.
  - Smooth step transitions, a visible progress indicator across the steps,
    clear primary buttons, and a confident review screen.
  - Fully responsive / mobile-first (the earlier mobile overflow issues must not
    return — stat numbers and long values must wrap inside their containers).
  - Keep it tasteful and minimal: bold type, lots of whitespace, one primary
    accent. Read /mnt/skills/public/frontend-design/SKILL.md-style restraint:
    intentional, not templated.

=== DONE CRITERIA ===
  - npm run build: zero errors.
  - Existing Playwright suite passes; update selectors if the form structure
    changed (this is the "no regressions" step — test fixes are in scope here).
  - The four booking modes all work with the sample config.
  - All brand colors come from config tokens.
  - Output engine-setup.sql if migrations are needed.
  - Commit to feat/booking-engine and open a PR. Do NOT merge or deploy.
  - Summarize what changed, list any new Supabase columns + env needs, and flag
    every deviation.
```

---

*(After this, Prompt T and Prompt C just supply config — see PROCESS.md for the order.)*
