# START HERE — Client CRM Feature Kit

This kit adds a **Clients tab** to the Smart Booking Tool's `/admin` dashboard.
Every person who makes a booking automatically becomes a client record — full
history, lifetime spend, outstanding balance, and private owner notes.

---

## Before you run anything

☐ Make sure the adaptive booking engine (Prompt E) is already merged and live.
  The CRM uses `category_label` and `option_name` from that schema.

☐ Make sure the payments feature is already merged and live.
  The CRM reads `payment_status` to calculate lifetime spend vs outstanding.

Both of those are done — you shipped them earlier today.

---

## The order

### ☐ Step 1 — Run the SQL
Supabase → SQL Editor → paste `crm-setup.sql` → Run.
Creates the `clients` table (notes + tags only — one tiny table).

### ☐ Step 2 — Drop CLAUDE.md into the project root
Replace the existing CLAUDE.md with this kit's CLAUDE.md so Claude Code reads
the right context. (Back up the old one first if you want.)

### ☐ Step 3 — Run P1 → P5 in Claude Code, one at a time
Open Claude Code in `~/auto-booking` and say:
"Read CLAUDE.md and run Prompt 1 from PROMPTS.md"
Wait for each to finish before running the next.

### ☐ Step 4 — Merge + deploy
Same as every other kit — merge the PR, watch Netlify deploy, do the live test.

---

## What each prompt does

| Prompt | What it builds |
|---|---|
| P1 | `admin-clients` Netlify function — aggregates one record per email from bookings |
| P2 | `admin-client-note` Netlify function — saves/loads owner notes + tags |
| P3 | Clients tab UI — searchable list with stats per client |
| P4 | Client detail panel — full history, stats, notes, tags |
| P5 | Build check, Playwright, branch + PR, manual checklist |

---

## What "done" looks like

- `/admin` has three tabs: **Bookings · Accounts · Clients**
- Every booker appears automatically as a client (no manual entry)
- Click a client → full booking history, lifetime spend, outstanding balance
- Owner can write private notes and add tags — they persist
- Merging a booking from the same email always goes to the same client record
