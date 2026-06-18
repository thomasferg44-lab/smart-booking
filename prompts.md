# PROMPTS.md — Final Feature Kit (Packs + Discount Codes + Lesson Tracker)

Run these in Claude Code one at a time, in order.
Read CLAUDE.md before each prompt. Branch: feat/final-features.
Do NOT merge or deploy until P3 is done and Thomas has done his live pass.

---

## Prompt 1 — Lesson packs + discount codes

```
Read CLAUDE.md first and follow all its rules. Work on branch feat/final-features.

Add two features to the Private Lessons booking flow only. Nothing else touched.

=== PART A: LESSON PACKS ===

The existing quantity stepper (1–20) stays. Add two pack options ABOVE the
stepper as selectable cards:

  • Pack of 5  — no discount, price = option.price × 5 + lane fee × 5
  • Pack of 10 — 10% discount on base price only (pay for 9, lane fee still
                 × 10 at full rate)
                 price = (option.price × 0.90 × 10) + (lane fee × 10)

When a pack card is selected:
  - The quantity stepper is hidden (pack size is fixed)
  - The pack card shows the total price and a small "Save X%" or "1 lesson free"
    badge for the pack of 10
  - The review screen shows: option name, pack size, base price, lane fee
    breakdown (if Lion's Pool), pack discount line (if pack of 10), and total

When no pack is selected (default), the stepper shows as before — single lessons,
no discount.

Server-side in submit-booking.js:
  - Add a trusted PACK_DISCOUNTS map: { 'pack-10': 0.90 } (pack-5 = 1.0)
  - Compute: base = option.price × pack_discount × quantity
  - Lane fee = LANE_FEES[duration] × quantity (always full rate, no discount)
  - Total price_kyd = base + lane_fee
  - Store: lesson_pack (text, nullable — 'pack-5', 'pack-10', or null for
    single), lesson_quantity (already exists)
  - Output migration: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS
    lesson_pack text;`

=== PART B: DISCOUNT CODES ===

On the review screen (Step 5), add a subtle small grey text link at the very
bottom: "Have a code?" — easy to miss, not prominent, no label on earlier steps.

Clicking it reveals a small inline input + Apply button (no page change, no modal).

Four valid codes (store these in companyConfig as a server-side-only object —
NEVER expose the codes to the client bundle. The validation must happen in
submit-booking.js only):
  GRANT5  → 5% off
  GRANT10 → 10% off
  GRANT20 → 20% off
  GRANT25 → 25% off

Discount applies to the base lesson price only (after pack discount if applicable),
NOT to lane fees. Stacks with pack discount:
  final = (option.price × pack_discount × quantity × code_discount) + lane_fees

IMPORTANT — the codes must NEVER appear in the client-side bundle. Store them
only in a server-side map in submit-booking.js (or a shared server file). The
client sends the code string; the server looks it up and applies the discount.
The client never knows valid code names from the source code.

On the review screen: if a valid code is applied, show a green "Code applied —
X% off" line in the price breakdown. If invalid, show a small red "Invalid code"
message inline. The Apply button calls a lightweight Netlify function
`validate-discount.js` that returns { valid, discountPct } — it confirms the
code is real without revealing all valid codes (just returns the % for the
submitted code).

Store on booking: discount_code (text, nullable), discount_pct (integer, nullable).
Migration: `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_code text;
            ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_pct integer;`

Show the discount in BookingCard.jsx and ClientDetail.jsx booking history
(e.g. "GRANT20 — 20% off").

=== DONE CRITERIA ===
  - npm run build zero errors, Playwright 7/7.
  - Pack pricing math verified (node): pack-10, 1hr, Lion's Pool =
    (100×0.9×10) + (25×10) = 900 + 250 = 1150 KYD ✓
  - Discount codes never in client bundle (verify with grep).
  - Commit to feat/final-features, summarize, flag deviations.
```

---

## Prompt 2 — Lesson tracker

```
Read CLAUDE.md first and follow all its rules. Stay on feat/final-features.

Build the lesson tracker. This is an admin-only feature — clients never see it.

=== DATABASE ===
Output a migration file `lesson-tracker-setup.sql`:

CREATE TABLE IF NOT EXISTS lesson_logs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid REFERENCES bookings(id) ON DELETE CASCADE,
  client_email  text NOT NULL,
  lesson_date   date NOT NULL,
  lessons_count integer NOT NULL DEFAULT 1,  -- allows logging multiple at once
  notes         text,
  logged_at     timestamptz DEFAULT now(),
  logged_by     text DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS idx_lesson_logs_email
  ON lesson_logs (client_email);
CREATE INDEX IF NOT EXISTS idx_lesson_logs_booking
  ON lesson_logs (booking_id);

=== SERVER ===
Create two Netlify functions, authenticated like all other admin functions:

1. netlify/functions/admin-lesson-log.js
   POST { booking_id, client_email, lesson_date, lessons_count (1–20), notes? }
   → inserts a lesson_log row, returns the new row.
   Validation: all required fields, lessons_count 1–20, lesson_date valid date.

2. netlify/functions/admin-lesson-stats.js
   GET ?email=X → returns for that client:
     totalLessonsLogged  — sum of lessons_count across all their lesson_logs
     totalLessonsPaid    — sum of lesson_quantity across their confirmed bookings
                           (i.e. what they've paid for in total)
     remaining           — totalLessonsPaid - totalLessonsLogged (can be 0 or
                           negative if over-delivered)
     logs                — all lesson_log rows for this client, newest first
       (id, booking_id, lesson_date, lessons_count, notes, logged_at)

=== ADMIN UI ===
Add a "Lessons" section to ClientDetail.jsx (below booking history, above notes):

SUMMARY STRIP:
  • Lessons completed: X
  • Lessons paid for: Y
  • Remaining: Z  (highlighted in accent color if > 0, grey if 0)

LOG A LESSON button → opens an inline form (not a modal, just expands below):
  • Date picker (defaults to today)
  • "Number of lessons" stepper 1–20 (default 1) — so you can log
    "3 lessons on June 5" in one tap
  • Optional notes field (e.g. "worked on freestyle turns")
  • Save button → calls admin-lesson-log → refreshes stats + log

LESSON LOG LIST (below the form):
  Each entry: date, lessons count (e.g. "× 3"), notes (if any), logged_at time.
  Newest first. Simple, clean, no delete (logs are permanent).

Design: native to the existing admin UI, same tokens, mobile-first.

=== DONE CRITERIA ===
  - npm run build zero errors, Playwright passes.
  - Summarize, flag deviations.
```

---

## Prompt 3 — Final check, branch + PR

```
Read CLAUDE.md first and follow all its rules.

Finalize the complete final-features branch for Thomas's live pass.

1. npm run build — zero errors.
2. Playwright — 7/7, no regressions. Fix any broken selectors in scope.
3. Confirm all functions bundle: submit-booking, validate-discount,
   admin-lesson-log, admin-lesson-stats, plus all existing functions.
4. SECURITY CHECK: grep the client bundle for 'GRANT' — confirm discount
   codes are NOT present in any client-side file. Report the result.
5. No secrets committed, .gitignore clean.
6. Commit to feat/final-features, open PR. Do NOT merge or deploy.

Produce a MANUAL CHECKLIST for Thomas:
  - Run lesson-tracker-setup.sql in Supabase
  - Run the lesson_pack + discount_code column migrations in Supabase
  - Merge PR → deploy
  - Test pack of 10: confirm 10% discount shows, lane fee full price
  - Test discount code GRANT20: confirm 20% off base, not lane fee
  - Test "Have a code?" is subtle and not prominent
  - Open a client in /admin → Lessons section shows, log a lesson,
    stats update, log entry appears
  - Log multiple lessons on one date (lessons_count > 1) — stats update correctly
  - Confirm codes not visible in browser dev tools source

Summarize final state of all three features.
```
