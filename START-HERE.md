# START HERE — Calendar Sync Feature Kit

This kit adds **automatic Google Calendar booking** to the Smart Booking Tool (`~/auto-booking`).

When a booking is **confirmed** in the admin dashboard:
1. The event is written straight into the **business owner's Google Calendar** (your dad's first).
2. The **customer** receives a calendar invite as a `.ics` file attached to an email (sent through your existing Resend setup).

It's built into the **main project**, so every client gets it. Per-client details (which calendar, what timezone, service durations) are set later in **Prompt C**.

---

## The order of operations

Do these **in sequence**. Don't skip ahead.

### ☐ Step 0 — Google setup (do this first, outside Claude Code)
Open **`GOOGLE-SETUP.md`** and complete it. You need two things in hand before the build is useful:
- A **service account** with a downloaded **JSON key**
- Your dad's **Calendar ID**

> You can still run P1–P4 in Claude Code *before* Google setup is finished — the code will build fine. You just won't be able to do the live test (P5) until the Google creds + calendar share are done.

### ☐ Step 1 — Run the SQL
Open **Supabase → SQL Editor**, paste the entire contents of **`calendar-setup.sql`**, and run it. This adds two columns to your `bookings` table (`calendar_event_id`, `calendar_synced_at`). Without this, P4 will fail to write back the event ID.

### ☐ Step 2 — Run the prompts P1 → P5
Open **`PROMPTS.md`**. Run each prompt in Claude Code **one at a time**, in order. Wait for each to finish and review its output before starting the next. Never stack prompts.

- **P1** — Config + duration map (placeholder durations, real ones come in Prompt C)
- **P2** — Google Calendar module (the auth + insert helper)
- **P3** — `.ics` builder + Resend customer-invite email
- **P4** — Wire both into the confirm flow
- **P5** — Build check, tests, branch + PR

### ☐ Step 3 — Add env vars to Netlify
Before your live test, add these in **Netlify → Site settings → Environment variables**:

| Variable | What it is | Same for every client? |
|---|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The `client_email` from your JSON key | ✅ Yes — DropStack's shared account |
| `GOOGLE_PRIVATE_KEY` | The `private_key` from your JSON key (see note ⚠️ below) | ✅ Yes — DropStack's shared account |

> ⚠️ **The `GOOGLE_PRIVATE_KEY` gotcha.** The key in the JSON file contains literal `\n` characters. When you paste it into Netlify, paste it **exactly as it appears in the JSON** (with the `\n` sequences and the `-----BEGIN PRIVATE KEY-----` / `-----END PRIVATE KEY-----` lines). The code handles converting `\n` back into real line breaks. This is the #1 thing that breaks Google auth — if you get an auth error later, this is the first place to look.

Your existing `RESEND_API_KEY` (and from-address) is reused for the customer `.ics` email — no new Resend setup needed.

### ☐ Step 4 — Per-client values live in `companyConfig`, not env
These are set **per deployment** (your dad's deploy gets his, the next client gets theirs). P1 adds them as placeholders; **Prompt C** fills in the real values:
- `calendarId` — which calendar to write to
- `timezone` — defaults to `America/Cayman`
- `durationMinutes` on each service

---

## Why this split (read once, it'll make everything click)

- **DropStack owns ONE service account.** Its email + private key are the two env vars above, identical across every client deploy.
- **Each client shares THEIR calendar** with that one service account email. That's the entire onboarding — 20 seconds in their calendar settings. No client ever logs in, no OAuth screens, no per-client Google project.
- **The only per-client thing that changes is the Calendar ID** (in `companyConfig`). That's why this scales: new client = share calendar + set one ID in Prompt C.

---

## When you're done with the build
Come back and tell me. We'll do the live test together:
- Confirm a test booking → event appears on your dad's calendar
- Customer inbox receives the `.ics` invite
- Supabase row shows the `calendar_event_id` filled in

Then we move to onboarding it for the swim academy properly via Prompt C.
