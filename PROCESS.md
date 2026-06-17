# PROCESS — How to run E, T, and C (read this slowly)

You have three prompts. Here's what each one is, in plain English, and the exact
order to run them.

---

## What each prompt is

**PROMPT E — the Engine.**
This is the big one. It rebuilds your booking form into a smart, multi-category
system: the customer picks a category (Private Lessons, Swim Team, Summer Camp,
Water Polo, Splash Ball), then the form only asks for what that service needs
(a date+time for private lessons, just weeks for camp, nothing for fixed
classes, a level for Splash Ball). It also makes the whole thing look premium.
**It contains NO swim-academy details and NO DropStack details — it's the shared
machine.** Both your dad's site and your demo site run on this same engine.

**PROMPT T — the Template (DropStack demo).**
This just *feeds* the engine your DropStack blue/white branding and generic
sample services. It's the clean demo you'll link to from dropstack.co so
prospects can click "See it live" and play with the product — without seeing
your dad's swim branding.

**PROMPT C — the Client (your dad).**
This feeds the engine your dad's real services, real KYD prices, durations,
schedules, teal/gold branding, and his calendar ID. This is his live product.

Think of it like this:
> **E builds the car. T and C are two different paint jobs + dashboards.**

---

## The big decision: ONE project or TWO?

Right now you have one project: `~/auto-booking`, which deploys to your dad's
site. You need your dad's site AND a separate DropStack demo site. So you need
**two deployments** eventually.

Here's the clean way to do it, step by step.

---

## THE ORDER — do this exactly

### ① Run PROMPT E first, in your existing `~/auto-booking`

Why first: nothing else works until the engine exists. T and C just configure
the engine, so the engine has to be built before either of them means anything.

1. Drop `PROMPT-E-engine.md` into `~/auto-booking` (so you can copy from it).
2. In Claude Code: **"Read CLAUDE.md and run the prompt in PROMPT-E-engine.md"**
3. If it outputs `engine-setup.sql`, run that file in your Supabase SQL editor
   (same as you've done before).
4. Review, then merge the PR and deploy — confirm your dad's site still works
   end to end with the new engine (it'll still have his services from before,
   just in the new system). Fix anything broken before moving on.

**At this point your dad's site is running the new engine. Good.**

### ② Run PROMPT C next, still in `~/auto-booking`

Why C before T: your dad is your real, live, paying-attention client. Get his
real data in and confirmed first.

1. Drop `PROMPT-C-aqualife.md` into `~/auto-booking`.
2. In Claude Code: **"Read CLAUDE.md and run the prompt in PROMPT-C-aqualife.md"**
3. Fill in any placeholders it flags (camp week dates, phone, location).
4. Merge + deploy. Test all six categories on his live site. Confirm a private
   lesson still creates a calendar event + .ics. Done — **your dad is fully live.**

### ③ Make the DEMO copy, then run PROMPT T in it

Now — and only now — create the second project for the DropStack demo. You do
NOT want to run T on top of your dad's site (it would wipe his branding). So we
make a copy.

**Make the copy (in your terminal):**
```
cd ~
cp -R auto-booking dropstack-demo
cd dropstack-demo
rm -rf node_modules
git remote remove origin
```
That gives you a separate folder `~/dropstack-demo` that's a clone of the engine
but disconnected from your dad's GitHub/Netlify.

Then:
1. Create a NEW GitHub repo (e.g. `dropstack-demo`) and a NEW Netlify site from it.
   (You can ask me to walk you through this when you get here.)
2. Drop `PROMPT-T-template.md` into `~/dropstack-demo`.
3. In Claude Code (now working in the `dropstack-demo` folder):
   **"Read CLAUDE.md and run the prompt in PROMPT-T-template.md"**
4. Merge + deploy on the NEW Netlify site. This becomes `demo.dropstack.co`.

### ④ Point your website's "See it live" buttons at the demo

Once `demo.dropstack.co` is live, update the "See it live" links on dropstack.co
so they go to the demo instead of your dad's branded site.

---

## Quick reference

| Step | Prompt | Where | Result |
|---|---|---|---|
| 1 | **E** | `~/auto-booking` | Engine + redesign live on dad's site |
| 2 | **C** | `~/auto-booking` | Dad's real services live |
| 3 | **T** | `~/dropstack-demo` (new copy) | DropStack demo site |
| 4 | — | dropstack.co | "See it live" → demo |

---

## Why this order is safest
- E before C/T because config is meaningless without the engine.
- C before T because your dad is the real client — lock him in first.
- T in a *separate copy* so it never overwrites your dad's branding.
- Each step is merged, deployed, and tested before the next, so if something
  breaks you know exactly which step caused it.

---

## For every FUTURE client (the repeatable playbook)
1. `cp -R auto-booking <client-name>` (copy the engine).
2. New GitHub repo + new Netlify site.
3. Write a Prompt C-style config for them (I can generate it from their service
   list — same format as your dad's).
4. They share their Google Calendar with your service account email; you set
   their `calendarId`.
5. Deploy to `<client>.dropstack.co`.

That's the business. The engine never changes — you just paint it.

---

When you're ready to start, run **Prompt E** and tell me how it goes. When you
get to step ③ (making the demo copy + new Netlify site), ping me and I'll walk
you through the GitHub/Netlify setup click by click.
```

