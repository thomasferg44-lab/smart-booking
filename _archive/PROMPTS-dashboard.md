# PROMPTS.md — Build the Admin Dashboard

Run these in order, ONE at a time, inside the existing `auto-booking` project in Claude Code. After each prompt: let it finish, run `npm run build`, confirm zero errors, then move to the next. Don't paste the next prompt until the current one is done.

Before Prompt 1, make sure Claude Code has read `CLAUDE.md` and `DESIGN-BRIEF.md` in this project.

---

## PROMPT 1 — Backend: the two password-gated functions

```
Read CLAUDE.md and DESIGN-BRIEF.md fully before starting.

Build the two new Netlify Functions that power the admin dashboard. Do NOT touch submit-booking.js or any existing file.

Create netlify/functions/admin-bookings.js:
- Handler accepts POST only (else 405).
- Parse JSON body; expect { password }.
- If password !== process.env.ADMIN_PASSWORD, return 401 with { error: "Unauthorized" } and nothing else.
- Reuse the same Supabase client pattern as submit-booking.js, using process.env.SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY.
- Query the bookings table, select all columns, order by created_at descending.
- Return 200 with { bookings: [...] }.
- Wrap in try/catch, log errors server-side, return 500 with a generic message on failure.

Create netlify/functions/admin-update.js:
- Handler accepts POST only (else 405).
- Parse JSON body; expect { password, id, status }.
- Validate password against process.env.ADMIN_PASSWORD (401 if wrong).
- Validate status is one of: "confirmed", "cancelled", "pending" (400 if not).
- Validate id is present (400 if not).
- Update the matching bookings row's status; return 200 with { success: true }.
- try/catch with generic 500 on failure.

Both functions must never expose the service key or password in any response.

Add ADMIN_PASSWORD to .env.example with a placeholder.

Run npm run build and confirm zero errors. List the two files you created and confirm submit-booking.js was not modified.
```

---

## PROMPT 2 — Routing + the password gate

```
Read CLAUDE.md and DESIGN-BRIEF.md.

Set up the admin route and login gate. The booking form stays exactly as is.

1. If react-router-dom is not installed, install it. Wire the app so:
   - "/" renders the existing booking form (unchanged).
   - "/admin" renders the new admin experience.
   Keep the existing netlify.toml SPA redirect (/* -> /index.html) so /admin resolves.

2. Create src/admin/adminTheme.js:
   - Import companyConfig.
   - Export { brandName, accent } where accent = companyConfig.primaryColor || "#21B7B5".
   - Export an accentWash helper (accent at ~10% opacity) for soft fills.

3. Create src/admin/LoginGate.jsx following DESIGN-BRIEF.md:
   - A centred, calm password screen on the --canvas background.
   - Branded with brandName from adminTheme.
   - One password input (type=password) + one "Enter" button using the accent.
   - On submit, call admin-bookings with { password }. If 200, lift the password up to the parent and store it in sessionStorage under "admin_pw". If 401, show the message "That password didn't match." inline, no alert boxes.
   - Frosted, premium, minimal. Inter font, tight tracking per the brief.

4. Create src/admin/AdminApp.jsx:
   - On mount, read sessionStorage "admin_pw". If present, try loading bookings; if it works, go straight to the dashboard (skip the gate).
   - If no valid password, show LoginGate.
   - Once authenticated, render <Dashboard password={pw} /> (Dashboard comes next prompt — for now render a placeholder that says "Authenticated").

Load the Inter font (Google Fonts) globally.

Run npm run build, confirm zero errors. Confirm "/" still shows the booking form untouched.
```

---

## PROMPT 3 — The dashboard: stats, frosted bar, bookings list

```
Read CLAUDE.md and DESIGN-BRIEF.md again before building UI. Follow the brief's tokens, type scale, spacing, and the frosted-bar signature element exactly.

Build src/admin/Dashboard.jsx and its child components. Use the password prop to call admin-bookings on mount and load all bookings into state.

Components to create:

src/admin/StatusPill.jsx
- Props: status. Renders a colour-coded pill per the brief's status colours (pending/confirmed/cancelled inks on their washes). Rounded 999px, 11px tracked label.

src/admin/BookingCard.jsx
- Props: booking, onUpdate.
- A surface card with hairline border and the soft shadow from the brief.
- Top line: name (600) + service · formatted date · time on the right.
- Second line: email in --ink-soft + a StatusPill.
- Tap/click to expand: reveal intake_data as clean label/value rows (format snake_case keys to Title Case) plus notes if present.
- Action buttons: "Confirm" and "Cancel". Only show "Confirm" if not already confirmed; only show "Cancel" if not already cancelled. On click, call onUpdate(id, status). While the request is in flight, disable the buttons.
- When status changes, animate the pill colour with a soft spring and settle the card (respect prefers-reduced-motion).

src/admin/Dashboard.jsx
- The frosted sticky command bar (signature element): backdrop-blur, translucent white, hairline bottom border. Inside: brandName on the left; a rounded search field; a segmented status filter (All / Pending / Confirmed / Cancelled).
- Below the bar: an eyebrow "BOOKINGS" + today's date on the right.
- A stats row of three cards: Total, Pending (uses accent), This Week (created_at within last 7 days). Big tabular numbers per the brief.
- The bookings list, newest first, filtered by the search text (name or email, case-insensitive) and the active status filter.
- onUpdate handler calls admin-update with { password, id, status }, then optimistically updates local state and shows a toast ("Booking confirmed." / "Booking cancelled.").
- Loading state: a quiet skeleton of ~4 rows, not a spinner.
- Empty state per the brief's copy.
- Fully responsive: flawless at 390px wide. Stat cards scroll/stack, frosted bar collapses search into an icon on mobile.

Run npm run build, confirm zero errors.
```

---

## PROMPT 4 — Design refinement pass (the loop)

```
Read DESIGN-BRIEF.md once more. Now critique and refine the dashboard against it.

Run the dev server, open /admin, log in, and take screenshots at desktop (1280px) and mobile (390px) widths. For each screen, work through the brief's self-critique checklist:
- Does it look like one deliberate product, not an admin template?
- Is the accent used in 3 or fewer places per screen?
- Are all numbers tabular, labels tracked-out 11px uppercase?
- Is the frosted bar genuinely frosted when content scrolls under it?
- Is it flawless on a 390px phone?
- What one thing can be removed?

Identify the 5 biggest gaps between what you built and the brief, fix them, screenshot again, and confirm each is resolved. Pay special attention to: tracking on large type, shadow softness, the frosted blur actually rendering, spacing consistency on the 8px grid, and the confirm-status spring animation feeling smooth.

Do at least two refinement rounds. Show me before/after notes on what you changed and why. Then run npm run build.
```

---

## PROMPT 5 — Local test + deploy

```
Read CLAUDE.md.

1. Add ADMIN_PASSWORD to my local .env with a test value.
2. Run `npx netlify dev`. Walk me through testing end to end:
   - / still shows the booking form and a test submission still works.
   - /admin shows the gate; wrong password is rejected; correct password loads the dashboard.
   - Bookings load newest first; search and status filter work.
   - Confirm and Cancel update a booking and the change persists after refresh.
   - Check it on a phone-width window.
3. When local passes, give me the exact git commands to commit and push.
4. Give me the exact list of what to set in Netlify:
   - Add env var ADMIN_PASSWORD (the real password for this client).
   - Confirm SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are already set.
   - Trigger a deploy without cache.
5. Tell me how to test the live /admin once deployed.
```

---

## PER-CLIENT REUSE (after the first build)

For each new client you sell the booking tool to:
1. White-label `companyConfig.js` (brandName, services, intake fields, primaryColor) — the dashboard auto-themes to their accent.
2. Set a unique `ADMIN_PASSWORD` for them in their Netlify site.
3. Deploy. Their dashboard lives at `their-site.netlify.app/admin`.
4. Hand them the `/admin` link + password. That's the product.

---

## CONTEXT HANDOFF PROMPT
Use this if you start a fresh Claude Code chat mid-build.

```
I'm adding an admin dashboard to my existing auto-booking project (React + Vite + Tailwind, Netlify Functions, Supabase bookings table, Resend emails). The dashboard lives at /admin, is password-gated via two Netlify functions (admin-bookings.js, admin-update.js) that check process.env.ADMIN_PASSWORD, and lets the owner view/search/filter bookings and Confirm/Cancel them. The look follows DESIGN-BRIEF.md (calm, Apple/Stripe-grade, frosted sticky bar as the signature, accent pulled from companyConfig.primaryColor).

Where I am:
- Prompts completed: [LIST e.g. P1, P2]
- Current issue / next step: [DESCRIBE]
- Last npm run build result: [PASTE]

Read CLAUDE.md and DESIGN-BRIEF.md and continue from where I left off.
```
