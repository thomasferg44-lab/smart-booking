# PROMPTS.md — Smart Booking + Intake Form
# Run these in order. One at a time. Wait for each to finish before pasting the next.
# After every prompt: confirm `npm run build` passes with zero errors.

---

## PROMPT 1 — Scaffold + config
▶ START ─────────────────────────────────────────────────────────────────────

Read CLAUDE.md.

Scaffold the full project. Do all of the following:

1. Run `npm create vite@latest . -- --template react` to init the Vite React project in the current folder

2. Install all frontend deps:
   ```
   npm install
   npm install -D tailwindcss@3 postcss autoprefixer
   npx tailwindcss init -p
   ```

3. Install function deps:
   ```
   cd netlify/functions && npm install @supabase/supabase-js resend && cd ../..
   ```

4. Create `netlify.toml` with:
   - build command: `npm run build`
   - publish: `dist`
   - functions directory: `netlify/functions`
   - SPA redirect: `/* → /index.html` status 200

5. Configure Tailwind: update `tailwind.config.js` content to include `./index.html` and `./src/**/*.{js,jsx}`

6. Create `src/index.css` with:
   - `@tailwind base/components/utilities`
   - CSS variables: `--color-primary` and `--color-accent` on `:root`
   - `.input` class: full-width, border, rounded-lg, focus ring using `--color-primary`
   - `.btn-primary` class: background `var(--color-primary)`, white text, hover brightness filter, disabled opacity
   - `.text-brand`, `.border-brand` utility classes using CSS vars

7. Create `src/companyConfig.js` — copy this exactly:

```js
export const companyConfig = {
  name: 'Cayman AquaLife Academy',
  tagline: 'Book your swimming lesson',
  logo: '/logo.png',
  primaryColor: '#21B7B5',
  accentColor: '#E7A034',
  ownerEmail: 'thomas@aqualife.ky',
  ownerName: 'Thomas',
  replyToEmail: 'noreply@aqualife.ky',
  services: [
    'Private lesson (1hr)',
    'Group session (1hr)',
    'Stroke assessment (30min)',
    'Junior squad trial',
  ],
  timeSlots: [
    '7:00 am', '8:00 am', '9:00 am',
    '4:00 pm', '5:00 pm', '6:00 pm',
  ],
  intakeFields: [
    {
      id: 'swimmer_name',
      label: 'Swimmer name',
      type: 'text',
      placeholder: 'If different from booking name',
      required: false,
    },
    {
      id: 'experience',
      label: 'Swimming experience',
      type: 'select',
      options: ['Complete beginner', 'Can float/kick', 'Beginner strokes', 'Intermediate', 'Advanced / competitive'],
      required: true,
    },
    {
      id: 'age_group',
      label: 'Age group',
      type: 'radio',
      options: ['Under 6', '6–12', '13–17', 'Adult (18+)'],
      required: true,
    },
    {
      id: 'goals',
      label: 'Goals for lessons',
      type: 'textarea',
      placeholder: 'e.g. learn freestyle, improve turns, prepare for competition...',
      required: false,
    },
    {
      id: 'medical',
      label: 'Any medical conditions or notes we should know?',
      type: 'textarea',
      placeholder: 'Leave blank if none',
      required: false,
    },
  ],
  confirmationMessage: "Thanks! We'll review your request and confirm your spot within 24 hours.",
  location: 'Lions Pool, George Town, Cayman Islands',
  locationUrl: 'https://maps.google.com/?q=Lions+Pool+Grand+Cayman',
}
```

8. Create `.env.example`:
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

9. Create `.gitignore` including: `node_modules`, `dist`, `.env`, `netlify/functions/node_modules`

10. Create `supabase-setup.sql`:
```sql
create table if not exists bookings (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null,
  phone         text,
  service       text not null,
  requested_date date not null,
  requested_time text not null,
  intake_data   jsonb default '{}'::jsonb,
  notes         text,
  status        text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'cancelled')),
  created_at    timestamptz not null default now()
);

create index if not exists bookings_status_idx on bookings(status);
create index if not exists bookings_date_idx on bookings(requested_date);
create index if not exists bookings_email_idx on bookings(email);

alter table bookings enable row level security;
```

11. Run `npm run build` — confirm zero errors. Report the dist size.

◀ END ───────────────────────────────────────────────────────────────────────


---

## PROMPT 2 — BookingForm (3-step UI)
▶ START ─────────────────────────────────────────────────────────────────────

Read CLAUDE.md.

Build the frontend. Create these files:

**`src/main.jsx`** — standard Vite React entry point, imports App and index.css

**`src/App.jsx`**:
- On mount, inject `--color-primary` and `--color-accent` CSS vars from companyConfig onto `document.documentElement`
- State: `submission` (null or the submitted form data)
- Renders `<BookingForm onSuccess={setSubmission} />` or `<ConfirmationPage submission={submission} />` based on state
- Outer div: `min-h-screen bg-gray-50`

**`src/components/IntakeField.jsx`**:
- Props: `{ field, value, onChange, primaryColor }`
- Renders the correct input based on `field.type`:
  - `text` → `<input type="text" className="input">`
  - `textarea` → `<textarea className="input resize-none" rows={3}>`
  - `select` → `<select className="input">` with options from `field.options`
  - `radio` → pill buttons (like the time slot picker). Selected pill: border and bg tint using `primaryColor`. Unselected: gray border, white bg.
  - `checkbox` → standard checkboxes with `accentColor: primaryColor` style, value is an array
- Label shows a red `*` if `field.required`

**`src/components/BookingForm.jsx`**:

3-step form with this structure:

Step 0 — "Your details": name (required), email (required), phone (optional)
Step 1 — "Book a slot": service dropdown, date picker (min=today), time slot pill grid (3 columns)
Step 2 — "A bit about you": all `companyConfig.intakeFields` rendered via `<IntakeField>`, plus a free-text notes textarea

Step indicator at top: numbered circles (1/2/3), filled with `primaryColor` for completed/current steps, connected by lines that fill when passed. Labels hidden on mobile.

Navigation:
- "Continue" button advances step (disabled if required fields on current step are empty)
- "Back" button on steps 1 and 2
- Final step shows "Request booking" button which calls `handleSubmit`

`handleSubmit`:
- POST to `/.netlify/functions/submit-booking` with all form state as JSON
- On success: call `onSuccess({ ...fields, bookingId: data.bookingId })`
- On error: show inline error message in a red box below the form
- Loading state: button shows "Sending…" and is disabled

Form card: `bg-white rounded-2xl border border-gray-100 shadow-sm p-6`

Logo at top: `<img src={companyConfig.logo}>` with `onError` that hides it if 404

Run `npm run build` after. Report any errors.

◀ END ───────────────────────────────────────────────────────────────────────


---

## PROMPT 3 — Netlify Function (Supabase + Resend)
▶ START ─────────────────────────────────────────────────────────────────────

Read CLAUDE.md.

Create `netlify/functions/submit-booking.js`. This is the secure backend — all API keys live here, never in the frontend.

The function must:

1. **Validate HTTP method** — return 405 if not POST

2. **Parse and validate body** — required fields: `name`, `email`, `service`, `date`, `time`. Return 400 if missing.

3. **Save to Supabase** using `@supabase/supabase-js`:
   - Init client with `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`
   - Insert into `bookings` table: name, email, phone, service, requested_date (date), requested_time (time), intake_data (intake object as jsonb), notes, status = 'pending'
   - `.select('id').single()` to get the new row id back
   - If DB error: log it, return 500

4. **Send two emails in parallel** using `resend` package:

   Both emails init Resend with `process.env.RESEND_API_KEY`

   **Client confirmation email** (to: client's email):
   - From: `DropStack <bookings@dropstack.co>`
   - Subject: `Your booking request — ${process.env.COMPANY_NAME}`
   - Reply-to: `process.env.OWNER_EMAIL`
   - HTML: clean inline-styled email showing their booking summary (service, date, time, all intake fields as key-value rows, reference ID)

   **Owner alert email** (to: `process.env.OWNER_EMAIL`):
   - From: `Booking Bot <onboarding@resend.dev>`
   - Subject: `New booking from ${name} — ${service}`
   - Reply-to: client's email (so owner can reply directly to client)
   - HTML: all form data including phone, intake fields, notes, booking ID

5. **Return** `{ success: true, bookingId: row.id }` with status 200

Email HTML must be clean inline-styled (no external CSS), readable on mobile, uses `process.env.PRIMARY_COLOR` for the accent badge/button color. Format intake_data entries as a readable table (replace underscores with spaces, capitalize labels, handle array values with join(', ')).

Use `Promise.all` for the two email sends so they run in parallel.

The function file uses `export const handler = async (event) => {}` ESM syntax. The `netlify/functions/package.json` already has `"type": "module"`.

Run `npm run build` after. Report any errors.

◀ END ───────────────────────────────────────────────────────────────────────


---

## PROMPT 4 — ConfirmationPage + final polish
▶ START ─────────────────────────────────────────────────────────────────────

Read CLAUDE.md.

1. Create `src/components/ConfirmationPage.jsx`:
   - Props: `{ submission }` which includes: name, email, service, date, time, bookingId
   - Large checkmark icon (inline SVG) in a circle with `primaryColor` tint background
   - Heading: "You're on the list!"
   - Paragraph: `companyConfig.confirmationMessage`
   - White card showing booking summary: formatted date (e.g. "Monday, 14 July 2025"), time, service, location with link if `companyConfig.locationUrl` exists, booking reference in monospace
   - Small text below: "A confirmation email has been sent to {email}"
   - Logo at bottom at 50% opacity

2. Polish `src/index.css`:
   - Make sure `.input` has a smooth `border-color` and `box-shadow` focus transition
   - Focus ring uses `color-mix(in srgb, var(--color-primary) 15%, transparent)`
   - `select.input` has a custom SVG chevron arrow via `background-image`
   - All transitions use `0.15s ease`

3. Update `index.html`:
   - Title: use `companyConfig.tagline` (hint: set it dynamically in App.jsx via `document.title`)
   - Add Google Fonts preconnect + Inter font link

4. Add a `public/` folder note in CLAUDE.md: tell future sessions that `logo.png` goes in `/public/` and the form auto-hides the img tag if 404

5. Run `npm run build` — confirm clean. Open `dist/index.html` and confirm it references the hashed JS and CSS bundles correctly.

Report final dist sizes.

◀ END ───────────────────────────────────────────────────────────────────────


---

## PROMPT 5 — Tests + deploy prep
▶ START ─────────────────────────────────────────────────────────────────────

Read CLAUDE.md.

1. Install Playwright:
   ```
   npm install -D @playwright/test
   npx playwright install chromium
   ```

2. Create `playwright.config.js`:
   - baseURL: `http://localhost:8888` (netlify dev port)
   - single project: chromium
   - testDir: `./tests`

3. Create `tests/booking.spec.js` with these tests:

   **Test 1 — Page loads**: visits `/`, checks for the tagline text from companyConfig

   **Test 2 — Step 0 validation**: Continue button is disabled with empty name/email. Fill name + email → Continue becomes enabled.

   **Test 3 — Step navigation**: Fill step 0 → click Continue → step 1 heading is visible. Click Back → step 0 heading is visible again.

   **Test 4 — Service dropdown**: On step 1, the service dropdown contains all options from companyConfig.services

   **Test 5 — Time slot picker**: Clicking a time slot pill marks it as selected (check border color or aria state)

   **Test 6 — Step 1 validation**: Continue disabled until service + date + time all selected

   **Test 7 — Full form flow (mock submit)**: Fill all 3 steps. Intercept the POST to `/.netlify/functions/submit-booking` and return `{ success: true, bookingId: 'test-123' }`. Click "Request booking". Confirmation page appears with "You're on the list!".

   **Test 8 — Error state**: Intercept the function call and return status 500 with `{ error: 'Server error' }`. Submit form. Error message appears in red.

   **Test 9 — Confirmation page content**: After mocked success, confirm booking summary card shows the service and time that were selected.

4. Create `DEPLOY.md`:
   ```
   # Deployment guide

   ## Local testing
   cp .env.example .env
   # Fill in all values
   npm install
   cd netlify/functions && npm install && cd ../..
   npx netlify dev
   # Visit http://localhost:8888

   ## Supabase setup
   1. Create project at supabase.com
   2. Go to SQL Editor → paste supabase-setup.sql → Run
   3. Get URL + service_role key from Settings → API

   ## Resend setup
   1. Add and verify the client's domain at resend.com
   2. Create an API key
   3. Confirm noreply@theirdomain.com is a verified sender

   ## Deploy to Netlify
   1. Push to GitHub
   2. Connect repo in Netlify dashboard
   3. Build command: npm run build | Publish: dist | Functions: netlify/functions
   4. Set all environment variables (from .env.example) in Site settings → Environment variables
   5. Trigger redeploy

   ## Per-client checklist
   - [ ] companyConfig.js updated
   - [ ] logo.png in /public
   - [ ] supabase-setup.sql run
   - [ ] Resend domain verified
   - [ ] All env vars set in Netlify
   - [ ] Test booking submitted
   - [ ] Both emails received
   - [ ] Supabase row confirmed
   ```

5. Run `npm run build` one final time. Confirm clean. Report dist sizes.

◀ END ───────────────────────────────────────────────────────────────────────


---

## PROMPT C — Client customization
## Run this for every new customer. Replace everything in [BRACKETS] first.
## Turn off Claude Code bypass permissions when running this prompt.
▶ START ─────────────────────────────────────────────────────────────────────

Read CLAUDE.md. Modify ONLY `src/companyConfig.js`. Do not touch any other file.

**Company:**
- name: [COMPANY NAME]
- tagline: [TAGLINE e.g. "Book your cleaning service"]
- logo: /logo.png (remind me to drop the file into /public)
- primaryColor: [HEX]
- accentColor: [HEX]

**Contact:**
- ownerEmail: [OWNER EMAIL]
- ownerName: [OWNER FIRST NAME]
- replyToEmail: [VERIFIED RESEND SENDER e.g. noreply@theirdomain.com]

**Services (one per line):**
[SERVICE 1]
[SERVICE 2]
[SERVICE 3]

**Time slots (one per line):**
[SLOT 1 e.g. "9:00 am"]
[SLOT 2]

**Intake fields:**
[Describe what info this business needs from clients before a session — e.g. "property size (small/medium/large), number of bedrooms, any pets?, special requests". I'll convert these into the correct field config.]

**Location:**
- location: [LOCATION NAME]
- locationUrl: [GOOGLE MAPS LINK or leave blank]

**Confirmation message:**
[What the client should see after submitting — e.g. "Thanks! We'll confirm your booking within 2 hours."]

After updating companyConfig.js, run `npm run build` to confirm no errors.
List every changed value back to me so I can verify.

Also remind me to update these Netlify environment variables:
OWNER_EMAIL, OWNER_NAME, COMPANY_NAME, REPLY_TO_EMAIL, PRIMARY_COLOR

◀ END ───────────────────────────────────────────────────────────────────────


---

## WORKFLOW SUMMARY

1. Create a new folder `smart-booking` → copy `CLAUDE.md`, `.claude/settings.json`, `PROMPTS.md` into it → open in VS Code
2. Run Prompts 1 → 2 → 3 → 4 → 5 in order (one at a time, wait for each to finish)
3. Add your `.env` values, run `npx netlify dev`, test the full flow
4. For every new client: run Prompt C with their details → update Netlify env vars → redeploy
5. Build time per new client after first: ~20 minutes Claude Code + 5 minutes Netlify

---

## CONTEXT HANDOFF PROMPT
## Use this if you start a new chat mid-build to bring Claude up to speed.
▶ START ─────────────────────────────────────────────────────────────────────

I'm building a Smart Booking + Intake Form tool using Claude Code in VS Code. This is a white-label booking tool for service businesses — React + Vite + Tailwind frontend, Netlify Functions backend, Supabase for storage, Resend for emails. No AI API calls.

Here's where I am:
- Prompts completed so far: [LIST WHICH ONES e.g. P1, P2]
- Current issue / next step: [DESCRIBE]
- Last `npm run build` result: [PASTE OUTPUT]

Read CLAUDE.md and continue from where I left off.

◀ END ───────────────────────────────────────────────────────────────────────
