# START HERE — Payment Tracking Feature

Adding payment tracking to the existing `auto-booking` project. When done, the owner sees every booking's price, can mark payments as received, and has a live accounts view showing what's owed vs paid.

## Before you open Claude Code

**Run the SQL first:**
1. Go to supabase.com → your project → SQL Editor
2. Paste the contents of `supabase-payments-setup.sql`
3. Hit Run — should return 4 rows confirming the new columns

**Then drop these files into `~/auto-booking/`:**
```
cp ~/Downloads/payments-kit/CLAUDE.md ~/auto-booking/CLAUDE.md
cp ~/Downloads/payments-kit/PROMPTS.md ~/auto-booking/PROMPTS.md
cp ~/Downloads/payments-kit/supabase-payments-setup.sql ~/auto-booking/
```
(This overwrites the dashboard CLAUDE.md — that build is done, it's fine.)

## Open Claude Code
```
cd ~/auto-booking
claude
```
Tell it: "Read CLAUDE.md, then we run PROMPTS.md one at a time."

## Run P1 → P5 in order
- P1: prices in companyConfig + server-side price on submit
- P2: price badge on booking form
- P3: admin-pay Netlify function + receipt email
- P4: Accounts tab UI (summary, filters, mark-as-paid modal)
- P5: end-to-end test + deploy

## What "done" looks like
- Client sees "KYD $75.00 (USD $61.50)" when they pick a service
- Owner opens /admin → Accounts tab → sees every booking with its price
- Summary: Total Owed / Paid / Outstanding in KYD + USD
- One click to mark paid → modal for date + method → receipt lands in client's inbox
- Supabase has payment_status, payment_date, payment_method on every row

## After this is done — Prompt C for Cayman AquaLife
Once the payment feature is built, run Prompt C to white-label the whole tool
for your dad's business: his logo, teal/gold colors, his actual lesson types
and real prices, his email, his admin password. That session takes ~20 minutes
and produces a separate deployed site just for him.

---

## Full project status
- ✅ Lesson Recap — live
- ✅ Smart Booking — live, admin dashboard working
- ✅ Invoice Generator — live
- ✅ DropStack website — live at dropstack.co
- 🔨 Payment tracking — this kit
- ⏳ Prompt C for Cayman AquaLife — after payment feature
- 📋 WhatsApp outreach to 7 Cayman prospects — whenever you're ready
