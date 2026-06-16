# START HERE — Admin Dashboard build

You're adding an owner dashboard to your existing **auto-booking** project. When you open your laptop:

## 1. Drop these 4 files into the auto-booking project root
- `CLAUDE.md`  ← if the project already has one for the booking tool, rename this to `CLAUDE-dashboard.md` and tell Claude Code to read it, OR replace the old one (the booking tool is already built, so replacing is fine).
- `DESIGN-BRIEF.md`
- `PROMPTS.md`
- `supabase-admin-setup.sql`

## 2. Run the SQL once
Open Supabase → SQL Editor → paste `supabase-admin-setup.sql` → Run. This makes sure the `status` column and indexes exist. Safe to run even if they already do.

## 3. Open the project in Claude Code
```
cd ~/auto-booking
claude
```
Tell it: **"Read CLAUDE.md and DESIGN-BRIEF.md, then we're running the prompts in PROMPTS.md one at a time."**

## 4. Run PROMPTS.md in order
P1 → P2 → P3 → P4 → P5. One at a time. After each: `npm run build`, confirm zero errors, test, then continue. Don't rush P4 — that's the design polish pass that makes it look expensive.

## 5. What "done" looks like
- `your-site.netlify.app/admin` → branded password screen
- Right password → calm, frosted, high-end dashboard of all bookings
- Search, status filter, Confirm/Cancel all working and persisting
- Flawless on your phone

## Remember the security rule
The Supabase service key and the admin password live ONLY in Netlify env vars and the functions. They never go in frontend code. The kit is built around this — don't let any prompt put them in the React app.

## After it's built
Each new client: white-label `companyConfig.js`, set their own `ADMIN_PASSWORD` in their Netlify site, deploy, hand them the `/admin` link + password. That link IS the product.

---

### Where we left off on the broader project (so you don't lose the thread)
- **Lesson Recap tool** — LIVE at fanciful-macaron-d5bbdd.netlify.app. Logo still to add.
- **Booking tool** — form + Supabase + owner email working. Customer confirmation email is BLOCKED until the domain is verified in Resend.
- **Domain** — bought `dropstack.co`. Cloudflare nameservers being set (houston/meg.ns.cloudflare.com) on Namecheap. NEXT after nameservers propagate: verify dropstack.co in Resend, set up thomas@dropstack.co email forwarding, then build the dropstack.co website.
- **This kit** — the booking tool's missing admin dashboard.
- **Tuesday morning** — send the 7 WhatsApp messages to the Cayman prospects.
