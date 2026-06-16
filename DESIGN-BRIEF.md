# DESIGN-BRIEF.md — Admin Dashboard look & feel

This is the visual spec. Follow it exactly. The goal: an owner opens `/admin` and instantly feels they are using a serious, expensive, well-made product — the kind of restrained precision people associate with Apple, Linear, and Stripe. Not flashy. **Calm, confident, precise.**

The discipline here is restraint. High-end is not more decoration — it is fewer things, perfectly spaced, with one quiet moment of delight. Before you finish any screen, remove one thing.

---

## The single design thesis
**"A calm control room."** The owner glances at it between lessons and instantly knows what needs their attention. Pending bookings quietly pull the eye; everything else recedes. Spend your boldness on one signature element (below) and keep everything else disciplined and quiet.

---

## Colour tokens

A near-white canvas with graphite ink — the Apple/Stripe register. The single accent is pulled live from `companyConfig` so every client's dashboard wears their own brand colour. Use the accent sparingly: active states, the signature element, one number that matters. Never flood the screen with it.

```
--canvas      #FBFBFD   /* page background — barely-there cool white */
--surface     #FFFFFF   /* cards, bars */
--ink         #1D1D1F   /* primary text — graphite, not pure black */
--ink-soft    #6E6E73   /* secondary text, labels */
--hairline    #E8E8ED   /* 1px dividers, card borders */
--accent      <from companyConfig.primaryColor, fallback #21B7B5>
--accent-wash <accent at 10% opacity, for soft fills>

/* status colours — muted, not loud */
--pending     #B7791F   /* warm amber ink */  on wash #FEF6E7
--confirmed   #1A7F5A   /* green ink */        on wash #E7F5EE
--cancelled   #8A8A8E   /* grey ink */         on wash #F2F2F4
```

---

## Typography

System-feel precision. Use **Inter** for everything (it reads as SF Pro's cousin and is free on Google Fonts), with tight tracking on large text — that negative tracking is what makes type feel "Apple." One face, many weights, set with care.

```
Display / page title:   Inter, 600 weight, -0.02em tracking, 28–32px
Section headers:        Inter, 600, -0.01em, 15px
Stat numbers:           Inter, 600, -0.03em, 40px (tabular-nums)
Body / booking data:    Inter, 400–500, 14–15px
Labels / eyebrows:      Inter, 500, 11px, +0.06em tracking, UPPERCASE, --ink-soft
```
Always use `font-variant-numeric: tabular-nums` on numbers so they don't jiggle.

---

## Spacing & form

Generous, consistent, calm.
- 8px base grid. Card padding 24px. Section gaps 32–40px.
- Border radius: 14px on cards, 10px on buttons/pills, 999px on the search field.
- Borders are 1px `--hairline`. Shadows are soft and low: `0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.04)`. Never harsh drop shadows.
- Max content width ~1080px, centred, breathing room on the sides.

---

## The signature element — spend your boldness here

**A frosted-glass top command bar that floats.** A sticky header with `backdrop-filter: blur(20px)` over a translucent white (`rgba(255,255,255,0.72)`), a hairline bottom border, and inside it: the business name (branded), a single search field, and the status filter as a quiet segmented control. As the owner scrolls the bookings, the bar stays, frosted, with content sliding under it. This one element does the heavy lifting of "premium." Everything below it stays calm.

Pair it with **one** micro-moment: when a booking is confirmed, its status pill animates with a soft spring from amber to green and the card settles with a gentle ease. That single transition is the delight. Don't add more.

---

## Layout (ASCII wireframe)

```
┌────────────────────────────────────────────────────────┐
│ ░░ FROSTED BAR (sticky, blur) ░░                        │
│  Cayman AquaLife          [ search…○ ]  All Pend Conf X │
└────────────────────────────────────────────────────────┘

   BOOKINGS                                    Tuesday, Jun 16

   ┌──────────┐  ┌──────────┐  ┌──────────┐
   │   24     │  │    5     │  │    8     │     ← stat cards
   │ TOTAL    │  │ PENDING  │  │ THIS WK  │       (pending uses accent)
   └──────────┘  └──────────┘  └──────────┘

   ┌────────────────────────────────────────────────────┐
   │ Jonny Smith            Private lesson · Tue 8:00am  │  ← row, hairline
   │ jonny@email.com                       ● Pending     │     between rows
   │                              [ Confirm ]  [ Cancel ] │
   └────────────────────────────────────────────────────┘
   ┌────────────────────────────────────────────────────┐
   │ … tap a row to expand intake details (age, goals…) │
   └────────────────────────────────────────────────────┘
```

On mobile: stat cards become a horizontal scroll row or stack; bookings become full-width cards; the frosted bar collapses search into a tap-to-expand icon. It must be flawless on a phone — the owner will check this on their phone between sessions.

---

## Motion
- Page load: stat cards and rows fade+rise 8px, staggered 40ms each. Once, subtly.
- Status change: spring transition on the pill colour + a soft row settle.
- Hover (desktop): row lifts 1px, shadow deepens slightly.
- Respect `prefers-reduced-motion` — disable all of the above when set.

---

## Copy voice
Plain, calm, owner-facing. Never expose system words.
- Empty state: **"No bookings yet."** / "New booking requests will appear here the moment someone submits the form."
- Wrong password: **"That password didn't match."** — no apology, no jargon.
- Confirm button → toast: **"Booking confirmed."** Cancel → **"Booking cancelled."** (action keeps its name through the flow).
- Loading: a quiet skeleton of the rows, not a spinner.

---

## Self-critique checklist before calling a screen done
- [ ] Does it look like one deliberate product, not a Bootstrap admin template?
- [ ] Is the accent used in ≤3 places per screen?
- [ ] Is every number tabular and every label tracked-out uppercase 11px?
- [ ] Is the frosted bar genuinely frosted (blur visible when content scrolls under)?
- [ ] Does it look right on a 390px-wide phone screen?
- [ ] Did I remove one unnecessary thing?
