# PROMPT C — Cayman AquaLife Academy (your dad's live config)

**Run this in your dad's copy of the project (the existing `~/auto-booking` lineage / his deploy).**

This prompt fills the engine with your dad's real services, prices, durations,
schedule rules, branding, and calendar ID. No engine changes — pure config.

---

## Copy everything below into Claude Code

```
Read CLAUDE.md first and follow all its rules. Work on branch feat/aqualife-config.

This deployment is CAYMAN AQUALIFE ACADEMY (Coach Grant's swim business).
Configure companyConfig.js ONLY (plus brand tokens / CSS variables). Do NOT change
the adaptive booking engine from Prompt E — only feed it this client's data.

=== BRANDING ===
  - companyName: 'Cayman AquaLife Academy'
  - Brand tokens: primary teal #21B7B5, accent gold #E7A034 (the academy's
    existing palette). Drive everything from these tokens.
  - currency: 'KYD' with the existing KYD→USD usdRate (keep the dual-currency
    badge — the customer sees KYD with USD shown).
  - timezone: 'America/Cayman'
  - calendarId: 'coachgrantcayman@gmail.com'   // dad's calendar (already shared
    with the service account)
  - ownerEmail / replyTo: Coach Grant's email.
  - phone / location: <Thomas to fill in if not already set>

=== SERVICES (all prices KYD) ===

1) PRIVATE LESSONS  — bookingMode: 'datetime'  (customer picks date + time)
   - 1 child · 30 min  → 50,  durationMinutes 30
   - 1 child · 1 hr    → 100, durationMinutes 60
   - 2 children · 30 min → 60,  durationMinutes 30
   - 2 children · 1 hr   → 120, durationMinutes 60
   - 3 children · 30 min → 75,  durationMinutes 30
   - 3 children · 1 hr   → 150, durationMinutes 60

2) SWIM TEAM  — bookingMode: 'fixed'  (no date/time entry)
   scheduleNote: 'Saturday classes (1 hr) and Wednesday classes (30 min).'
   - Saturday class (1 hr)        → 35,  durationMinutes 60
   - Saturday · 8-class pack      → 240, durationMinutes 60, isPackage, packageCount 8
   - Wednesday class (30 min)     → 35,  durationMinutes 30
   - Wednesday · 8-class pack     → 240, durationMinutes 30, isPackage, packageCount 8

3) SUMMER CAMP  — bookingMode: 'weeks'  (customer picks week(s); Mon–Fri 9:30–12:30)
   - Drop-in (per day)            → 65,  durationMinutes 180
   - 1 week (Mon–Fri, 9:30–12:30) → 300, durationMinutes 180
   - 3 weeks                      → 750, durationMinutes 180, isPackage
   discountNote: 'Water polo team members: special 5-week rate. Splash Ball team
     members: 50% off per week. Your coach will confirm any team discount on your
     invoice.'
   (The form must NOT calculate these discounts — display the note only.)
   weekOptions: <Thomas to set the actual camp week dates; placeholders fine now>

4) WATER POLO  — bookingMode: 'fixed'
   scheduleNote: 'Tuesday–Friday, 4:00–6:30 PM.'
   - Per session                  → 25,  durationMinutes 150
   - Per chukka (billed every 2 months) → 400, durationMinutes 150, isPackage

5) SPLASH BALL  — bookingMode: 'level'  (customer self-selects level, then option)
   Level "Splash Ball 1" — scheduleNote: 'Tue/Thu 3:30–4:00':
     - Per session → 15,  durationMinutes 30
     - Per chukka  → 200, durationMinutes 30, isPackage
   Level "Splash Ball 2" — scheduleNote: 'Tue/Thu 3:30–5:00':
     - Per session → 20,  durationMinutes 90
     - Per chukka  → 300, durationMinutes 90, isPackage

=== BOOKING BEHAVIOR RECAP (must match Prompt E engine) ===
  - ONLY Private Lessons ask for a date + time and create a precise timed
    calendar event + send the customer an .ics.
  - Swim Team, Water Polo, Splash Ball: no date/time entry — show the
    scheduleNote; on confirm, drop an all-day signup event on dad's calendar.
  - Summer Camp: customer selects week(s); on confirm, all-day event on the
    first selected week.
  - Team discounts: display-only note; dad applies them on the invoice.

=== DONE CRITERIA ===
  - npm run build: zero errors; Playwright passes.
  - All six categories render with correct KYD prices and the KYD→USD badge.
  - Teal/gold branding throughout; calendarId set to dad's calendar.
  - Commit to feat/aqualife-config, open a PR. Do NOT merge or deploy.
  - Summarize and flag deviations. Remind Thomas of any placeholders left to fill
    (camp week dates, phone, location).
```
