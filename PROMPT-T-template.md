# PROMPT T — DropStack Template (the demo prospects see)

**Run this SECOND, but run it in the DEMO copy of the project (see PROCESS.md), not your dad's.**

This prompt sets `companyConfig` to a clean, generic, **DropStack-branded** demo:
your blue/white website aesthetic and neutral sample services. This is the
version you link to from the "See it live" buttons on dropstack.co — what a
prospect sees to understand the product, with no swim-academy branding.

---

## Copy everything below into Claude Code

```
Read CLAUDE.md first and follow all its rules. Work on branch feat/template-config.

This deployment is the DROPSTACK DEMO — the public showcase version linked from
dropstack.co. Configure companyConfig.js ONLY (and brand tokens / CSS variables).
Do NOT change engine logic — the adaptive booking engine from Prompt E stays
exactly as built; we are only feeding it demo config and DropStack branding.

=== BRANDING (match the dropstack.co website) ===
  - companyName: 'DropStack'
  - tagline / hero copy in the booking tool: keep it generic and premium, e.g.
    "Book a service" — this is a demo, so it should feel like a clean product
    shell, not a specific business.
  - Brand tokens:
      primary  = electric blue  #2563EB   (the website's accent blue)
      ink/text = near-black      #0A0A0A
      surface  = white           #FFFFFF
      a dark slate section bg    #2D2F3E    (matches the product-cards section)
  - Typography: bold, confident, lots of whitespace — mirror the website's
    heavy headline style.
  - Remove any teal/gold (those belong to the swim academy, not DropStack).
  - calendarId: '' (the demo doesn't write to a real calendar — leave empty so
    calendar sync no-ops gracefully via the existing non-blocking handling).
  - timezone: 'America/Cayman'
  - currency: 'KYD' with the existing usdRate (or set a neutral demo currency if
    you prefer — but keep KYD so the KYD→USD badge demonstrates the feature).
  - ownerEmail / replyTo: a DropStack address (e.g. hello@dropstack.co).

=== DEMO SERVICES (neutral, show off all four booking modes) ===
Populate services[] with generic sample categories that demonstrate each
bookingMode so a prospect sees the engine's range — for example:
  - 'Consultation' (datetime) — 30 min / 60 min options
  - 'Weekly Class' (fixed) — single + package
  - 'Multi-Week Program' (weeks)
  - 'Tiered Service' (level) — Standard / Premium
Keep names business-agnostic so any prospect can picture their own business.

=== DONE CRITERIA ===
  - npm run build: zero errors; Playwright passes.
  - Booking tool renders in DropStack blue/white with demo services.
  - No swim-academy / teal / gold anywhere.
  - Commit to feat/template-config, open a PR. Do NOT merge or deploy.
  - Summarize and flag deviations.
```

---

*This becomes your `demo.dropstack.co` deploy. After it's live, update the
"See it live" links on dropstack.co to point here instead of your dad's site.*
