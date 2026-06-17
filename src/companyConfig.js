export const companyConfig = {
  name: 'Cayman AquaLife Academy',
  tagline: 'Book your swimming lesson',
  logo: '/logo.png',
  primaryColor: '#21B7B5',
  accentColor: '#E7A034',
  ownerEmail: 'thomasferg44@gmail.com',
  ownerName: 'Thomas',
  replyToEmail: 'noreply@aqualife.ky',
  phone: '',
  // Currency display — KYD primary, USD secondary at this fixed rate (used by PriceBadge).
  currency: 'KYD',
  usdRate: 0.82,
  // IANA timezone for calendar events. Prompt C may override it per client.
  timezone: 'America/Cayman',
  // Set in Prompt C — the Google Calendar ID to write confirmed bookings to
  calendarId: 'coachgrantcayman@gmail.com',

  // ── Adaptive booking engine ────────────────────────────────────────────────
  // `services` is a list of CATEGORIES. Each category declares how it books via
  // `bookingMode` and carries its bookable `options` (or `levels` for the 'level'
  // mode). This is sample/placeholder data — Prompt T and Prompt C supply the real
  // categories, prices and schedules. The engine is fully driven by this shape, so
  // no business specifics are hardcoded in the components.
  //
  // bookingMode:
  //   'datetime' → customer picks a date + time slot
  //   'fixed'    → no date/time; scheduleNote shown as read-only info
  //   'weeks'    → customer ticks one or more weeks from weekOptions
  //   'level'    → customer first picks a level, then an option within it
  services: [
    {
      id: 'private-lessons',
      label: 'Private Lessons',
      blurb: 'One-on-one coaching, you pick the time.',
      bookingMode: 'datetime',
      options: [
        { id: 'p-1c-30', name: '1 child · 30 min', price: 50, durationMinutes: 30 },
        { id: 'p-1c-60', name: '1 child · 1 hr', price: 100, durationMinutes: 60 },
        { id: 'p-2c-60', name: '2 children · 1 hr', price: 140, durationMinutes: 60 },
      ],
    },
    {
      id: 'swim-team',
      label: 'Swim Team',
      blurb: 'Weekly squad training on a fixed schedule.',
      bookingMode: 'fixed',
      scheduleNote: 'Saturdays (1 hr) and Wednesdays (30 min).',
      options: [
        { id: 'st-sat-single', name: 'Saturday class (1 hr)', price: 35, durationMinutes: 60 },
        { id: 'st-sat-8', name: 'Saturday · 8-class pack', price: 240, durationMinutes: 60, isPackage: true, packageCount: 8 },
      ],
      discountNote: 'Team members receive a discount — your coach will confirm it on your invoice.',
    },
    {
      id: 'summer-camp',
      label: 'Summer Camp',
      blurb: 'Pick the weeks that work for you.',
      bookingMode: 'weeks',
      weekOptions: [
        { id: 'wk1', label: 'Week 1 · Jul 7–11', startDate: '2026-07-07' },
        { id: 'wk2', label: 'Week 2 · Jul 14–18', startDate: '2026-07-14' },
        { id: 'wk3', label: 'Week 3 · Jul 21–25', startDate: '2026-07-21' },
      ],
      options: [
        { id: 'sc-dropin', name: 'Drop-in (per day)', price: 65, durationMinutes: 180 },
        { id: 'sc-1wk', name: '1 week (Mon–Fri, 9:30–12:30)', price: 300, durationMinutes: 180 },
      ],
      discountNote: '',
    },
    {
      id: 'water-polo',
      label: 'Water Polo',
      blurb: 'Fixed weekly sessions.',
      bookingMode: 'fixed',
      scheduleNote: 'Tue–Fri, 4:00–6:30 PM.',
      options: [
        { id: 'wp-session', name: 'Per session', price: 25, durationMinutes: 150 },
        { id: 'wp-chukka', name: 'Per chukka (every 2 months)', price: 400, durationMinutes: 150, isPackage: true },
      ],
    },
    {
      id: 'splash-ball',
      label: 'Splash Ball',
      blurb: 'Choose your level.',
      bookingMode: 'level',
      levels: [
        {
          id: 'sb1',
          label: 'Splash Ball 1',
          scheduleNote: 'Tue/Thu 3:30–4:00',
          options: [
            { id: 'sb1-session', name: 'Per session', price: 15, durationMinutes: 30 },
            { id: 'sb1-chukka', name: 'Per chukka', price: 200, durationMinutes: 30, isPackage: true },
          ],
        },
        {
          id: 'sb2',
          label: 'Splash Ball 2',
          scheduleNote: 'Tue/Thu 3:30–5:00',
          options: [
            { id: 'sb2-session', name: 'Per session', price: 20, durationMinutes: 90 },
            { id: 'sb2-chukka', name: 'Per chukka', price: 300, durationMinutes: 90, isPackage: true },
          ],
        },
      ],
    },
  ],

  // Time slots offered for 'datetime' categories.
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
