export const companyConfig = {
  name: 'Cayman AquaLife Academy',
  tagline: 'Book your swimming lesson',
  logo: '/logo.png',
  primaryColor: '#21B7B5',
  accentColor: '#E7A034',
  ownerEmail: 'thomas@aqualife.ky',
  ownerName: 'Thomas',
  replyToEmail: 'noreply@aqualife.ky',
  // IANA timezone for calendar events. Prompt C may override it per client.
  timezone: 'America/Cayman',
  // Set in Prompt C — the Google Calendar ID to write confirmed bookings to
  calendarId: '',
  services: [
    { name: 'Private lesson (1hr)', price: 75.00, durationMinutes: 60 },
    { name: 'Group session (1hr)', price: 40.00, durationMinutes: 60 },
    { name: 'Stroke assessment (30min)', price: 45.00, durationMinutes: 30 },
    { name: 'Junior squad trial', price: 0.00, durationMinutes: 60 }, // TODO: set real price (placeholder)
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
