export const companyConfig = {
  name: 'Cayman AquaLife Academy',
  tagline: 'Book your swimming lesson',
  logo: '/logo.png',
  primaryColor: '#21B7B5',
  accentColor: '#E7A034',
  ownerEmail: 'coachgrantcayman@gmail.com',
  ownerName: 'Thomas',
  replyToEmail: 'coachgrantcayman@gmail.com',
  phone: ' +13453263370 ',
  // Currency display — KYD primary, USD secondary at this fixed rate (used by PriceBadge).
  currency: 'KYD',
  usdRate: 1.22,
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
        { id: 'p-2c-30', name: '2 children · 30 min', price: 60, durationMinutes: 30 },
        { id: 'p-2c-60', name: '2 children · 1 hr', price: 120, durationMinutes: 60 },
        { id: 'p-3c-30', name: '3 children · 30 min', price: 75, durationMinutes: 30 },
        { id: 'p-3c-60', name: '3 children · 1 hr', price: 150, durationMinutes: 60 },
      ],
    },
    {
      id: 'swim-team',
      label: 'Swim Team',
      blurb: 'Weekly squad training on a fixed schedule.',
      bookingMode: 'fixed',
      scheduleNote: 'Saturday classes (1 hr) and Wednesday classes (30 min).',
      options: [
        { id: 'st-sat-single', name: 'Saturday class (1 hr)', price: 35, durationMinutes: 60 },
        { id: 'st-sat-8', name: 'Saturday · 8-class pack', price: 240, durationMinutes: 60, isPackage: true, packageCount: 8 },
        { id: 'st-wed-single', name: 'Wednesday class (30 min)', price: 35, durationMinutes: 30 },
        { id: 'st-wed-8', name: 'Wednesday · 8-class pack', price: 240, durationMinutes: 30, isPackage: true, packageCount: 8 },
      ],
    },
    {
      id: 'summer-camp',
      label: 'Summer Camp',
      blurb: 'Pick the weeks that work for you. Mon–Fri, 9:30–12:30.',
      bookingMode: 'weeks',
      // TODO (Thomas): set the real 2026 summer-camp week dates (labels + startDate).
      // startDate drives the all-day calendar event for the first selected week;
      // left blank for now, so it falls back to the booking's created date.
      weekOptions: [
        { id: 'wk1', label: 'Week 1', startDate: '' },
        { id: 'wk2', label: 'Week 2', startDate: '' },
        { id: 'wk3', label: 'Week 3', startDate: '' },
        { id: 'wk4', label: 'Week 4', startDate: '' },
      ],
      options: [
        { id: 'sc-dropin', name: 'Drop-in (per day)', price: 65, durationMinutes: 180 },
        { id: 'sc-1wk', name: '1 week (Mon–Fri, 9:30–12:30)', price: 300, durationMinutes: 180 },
        { id: 'sc-3wk', name: '3 weeks', price: 750, durationMinutes: 180, isPackage: true },
      ],
      discountNote:
        'Water polo team members: special 5-week rate. Splash Ball team members: 50% off per week. Your coach will confirm any team discount on your invoice.',
    },
    {
      id: 'water-polo',
      label: 'Water Polo',
      blurb: 'Fixed weekly sessions.',
      bookingMode: 'fixed',
      scheduleNote: 'Tuesday–Friday, 4:00–6:30 PM.',
      options: [
        { id: 'wp-session', name: 'Per session', price: 25, durationMinutes: 150 },
        { id: 'wp-chukka', name: 'Per chukka (billed every 2 months)', price: 400, durationMinutes: 150, isPackage: true },
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
