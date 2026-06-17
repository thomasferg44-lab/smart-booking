import { useState } from 'react'
import { companyConfig } from '../companyConfig'

const formatDate = (dateStr) => {
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ConfirmationPage({ submission }) {
  const [logoError, setLogoError] = useState(false)
  const {
    email,
    bookingId,
    categoryLabel,
    optionName,
    level,
    date,
    time,
    weeks,
    scheduleNote,
  } = submission
  const { primaryColor, location, locationUrl } = companyConfig

  return (
    <div className="max-w-xl mx-auto px-4 py-12 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: `${primaryColor}1A` }}
      >
        <svg
          className="w-8 h-8"
          viewBox="0 0 24 24"
          fill="none"
          stroke={primaryColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">You're on the list!</h1>
      <p className="text-gray-600 mb-6">{companyConfig.confirmationMessage}</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-left">
        <dl className="flex flex-col gap-3">
          <div>
            <dt className="text-sm text-gray-500">Service</dt>
            <dd className="font-medium text-gray-900">{categoryLabel}</dd>
          </div>

          {level && (
            <div>
              <dt className="text-sm text-gray-500">Level</dt>
              <dd className="font-medium text-gray-900">{level}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm text-gray-500">Option</dt>
            <dd className="font-medium text-gray-900">{optionName}</dd>
          </div>

          {date && (
            <div>
              <dt className="text-sm text-gray-500">Date</dt>
              <dd className="font-medium text-gray-900">{formatDate(date)}</dd>
            </div>
          )}

          {time && (
            <div>
              <dt className="text-sm text-gray-500">Time</dt>
              <dd className="font-medium text-gray-900">{time}</dd>
            </div>
          )}

          {weeks && weeks.length > 0 && (
            <div>
              <dt className="text-sm text-gray-500">Weeks</dt>
              <dd className="font-medium text-gray-900">{weeks.join(', ')}</dd>
            </div>
          )}

          {scheduleNote && !date && (
            <div>
              <dt className="text-sm text-gray-500">Schedule</dt>
              <dd className="font-medium text-gray-900">{scheduleNote}</dd>
            </div>
          )}

          {location && (
            <div>
              <dt className="text-sm text-gray-500">Location</dt>
              <dd className="font-medium text-gray-900">
                {locationUrl ? (
                  <a
                    href={locationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand hover:underline"
                  >
                    {location}
                  </a>
                ) : (
                  location
                )}
              </dd>
            </div>
          )}

          <div>
            <dt className="text-sm text-gray-500">Booking reference</dt>
            <dd className="font-mono text-sm text-gray-900">{bookingId}</dd>
          </div>
        </dl>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        A confirmation email has been sent to {email}
      </p>

      {!logoError && (
        <img
          src={companyConfig.logo}
          alt={companyConfig.name}
          className="h-8 mx-auto mt-10 object-contain opacity-50"
          onError={() => setLogoError(true)}
        />
      )}
    </div>
  )
}

export default ConfirmationPage
