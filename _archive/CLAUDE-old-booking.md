# CLAUDE.md — Smart Booking + Intake Form

Read this file at the start of every session. Follow it exactly.

---

## What this project is

A white-label booking and intake form tool for service businesses. A client lands on a page, fills in their details, picks a time slot, answers intake questions, and submits. Three things happen automatically:

1. The booking is saved to Supabase
2. The client gets a confirmation email via Resend
3. The business owner gets an alert email via Resend

This is sold as: one-time install fee + monthly subscription. The codebase never changes between clients — only `src/companyConfig.js` and environment variables change.

---

## Tech stack

- **React 18 + Vite + Tailwind CSS v3** — frontend
- **Netlify Functions** — secure backend proxy (API keys never touch the frontend)
- **Supabase** — stores every booking row
- **Resend** — sends both emails (client confirmation + owner alert)
- **No AI API** — this tool has zero AI costs. Do not add Claude or OpenAI calls.

---

## Project structure

```
smart-booking/
├── src/
│   ├── companyConfig.js          ← ONLY file changed per customer
│   ├── App.jsx                   ← injects CSS vars, handles step state
│   ├── main.jsx
│   ├── index.css                 ← .input and .btn-primary use CSS vars
│   └── components/
│       ├── BookingForm.jsx       ← 3-step form, reads config dynamically
│       ├── IntakeField.jsx       ← renders text/select/radio/checkbox/textarea
│       └── ConfirmationPage.jsx  ← shown after successful submit
├── netlify/
│   └── functions/
│       ├── submit-booking.js     ← saves to Supabase + fires both Resend emails
│       └── package.json          ← supabase-js + resend deps for functions
├── public/
│   └── logo.png                  ← per-customer logo, referenced by companyConfig.logo
├── supabase-setup.sql            ← run once in Supabase SQL editor
├── netlify.toml
├── .env.example
├── CLAUDE.md                     ← this file
└── PROMPTS.md                    ← sequential build prompts
```

---

## Non-negotiable rules

1. **Never hardcode API keys** — always from `process.env.*` in functions, never in frontend code
2. **Never change component structure to add AI** — this tool has no AI features
3. **The white-label layer is `companyConfig.js` only** — all per-customer changes go there
4. **`intake_data` in Supabase is jsonb** — dynamic fields dump into one column, schema never changes
5. **Always use `netlify dev` to test locally** — not `npm run dev`. Only `netlify dev` loads the Netlify Functions and `.env` into the function runtime
6. **Run `npm run build` after every prompt** — confirm zero errors before moving on
7. **Functions have their own `package.json`** — after installing in root, also `cd netlify/functions && npm install`

---

## companyConfig.js — the white-label layer

This is the ONLY file that changes between customer installs. It controls:

- `name`, `tagline`, `logo`, `primaryColor`, `accentColor` — branding
- `ownerEmail`, `ownerName`, `replyToEmail` — where emails go
- `services[]` — dropdown options for service type
- `timeSlots[]` — available time picker options
- `intakeFields[]` — dynamic form fields (text/textarea/select/radio/checkbox)
- `confirmationMessage` — what the client sees after submitting
- `location`, `locationUrl` — shown on confirmation page

**Logo**: drop `logo.png` into `/public/` — it's served at `/logo.png`, matching the default `companyConfig.logo` value. `BookingForm` and `ConfirmationPage` both render `<img src={companyConfig.logo}>` with an `onError` handler that hides the tag entirely if the file is missing (404), so the layout doesn't break for clients without a logo yet.

---

## Intake field types

| type | renders as |
|------|-----------|
| `text` | single-line input |
| `textarea` | multi-line input |
| `select` | dropdown |
| `radio` | pill button group (single select) |
| `checkbox` | checkbox list (multi-select) |

Each field: `{ id, label, type, required, placeholder?, options? }`

---

## Supabase table: bookings

| column | type | notes |
|--------|------|-------|
| id | uuid | auto pk |
| name | text | required |
| email | text | required |
| phone | text | optional |
| service | text | from services[] |
| requested_date | date | |
| requested_time | text | from timeSlots[] |
| intake_data | jsonb | all dynamic fields |
| notes | text | free text |
| status | text | pending / confirmed / cancelled |
| created_at | timestamptz | auto |

---

## Environment variables

Set in `.env` for local dev. Set in Netlify dashboard for production.

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
OWNER_EMAIL=
OWNER_NAME=
COMPANY_NAME=
REPLY_TO_EMAIL=
PRIMARY_COLOR=
```

---

## Current status

Track which prompts have been completed:

- [x] P1 — Scaffold + config
- [x] P2 — BookingForm (3-step UI)
- [x] P3 — Netlify Function (Supabase + Resend)
- [x] P4 — ConfirmationPage + polish
- [x] P5 — Tests + deploy prep
- [ ] PC — Client customization (run per customer)
