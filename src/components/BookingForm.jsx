import { Fragment, useState } from 'react'
import { companyConfig } from '../companyConfig'
import IntakeField from './IntakeField'
import PriceBadge from './PriceBadge'

const STEPS = ['Your details', 'Book a slot', 'A bit about you']

const today = new Date().toISOString().split('T')[0]

function BookingForm({ onSuccess }) {
  const [step, setStep] = useState(0)
  const [logoError, setLogoError] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [service, setService] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')

  const [intake, setIntake] = useState({})
  const [notes, setNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { primaryColor } = companyConfig

  const setIntakeValue = (id, value) => {
    setIntake((prev) => ({ ...prev, [id]: value }))
  }

  const isStepValid = () => {
    if (step === 0) {
      return name.trim() !== '' && email.trim() !== ''
    }
    if (step === 1) {
      return service !== '' && date !== '' && time !== ''
    }
    if (step === 2) {
      return companyConfig.intakeFields.every((field) => {
        if (!field.required) return true
        const value = intake[field.id]
        if (Array.isArray(value)) return value.length > 0
        return value !== undefined && value !== null && String(value).trim() !== ''
      })
    }
    return true
  }

  const handleContinue = () => {
    setError('')
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  const handleBack = () => {
    setError('')
    setStep((s) => Math.max(s - 1, 0))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/.netlify/functions/submit-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, service, date, time, intake, notes }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }

      onSuccess({ name, email, phone, service, date, time, intake, notes, bookingId: data.bookingId })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      {!logoError && (
        <img
          src={companyConfig.logo}
          alt={companyConfig.name}
          className="h-12 mx-auto mb-6 object-contain"
          onError={() => setLogoError(true)}
        />
      )}

      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: i <= step ? primaryColor : '#e5e7eb',
                  color: i <= step ? '#fff' : '#6b7280',
                }}
              >
                {i + 1}
              </div>
              <span className="text-xs text-gray-500 mt-1 hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 transition-colors"
                style={{ backgroundColor: i < step ? primaryColor : '#e5e7eb' }}
              />
            )}
          </Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Your details</h2>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name<span className="text-red-500"> *</span>
              </label>
              <input
                id="name"
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email<span className="text-red-500"> *</span>
              </label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Book a slot</h2>

            <div>
              <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                Service<span className="text-red-500"> *</span>
              </label>
              <select
                id="service"
                className="input"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                <option value="" disabled>
                  Select a service
                </option>
                {companyConfig.services.map((option) => (
                  <option key={option.name} value={option.name}>
                    {option.name}
                  </option>
                ))}
              </select>
              <PriceBadge service={service} services={companyConfig.services} />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Date<span className="text-red-500"> *</span>
              </label>
              <input
                id="date"
                type="date"
                className="input"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time<span className="text-red-500"> *</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {companyConfig.timeSlots.map((slot) => {
                  const selected = time === slot
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className="px-3 py-2 rounded-full border text-sm transition"
                      style={
                        selected
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: `${primaryColor}1A`,
                              color: primaryColor,
                            }
                          : {
                              borderColor: '#d1d5db',
                              backgroundColor: '#fff',
                              color: '#374151',
                            }
                      }
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-gray-900">A bit about you</h2>

            {companyConfig.intakeFields.map((field) => (
              <IntakeField
                key={field.id}
                field={field}
                value={intake[field.id]}
                onChange={(value) => setIntakeValue(field.id, value)}
                primaryColor={primaryColor}
              />
            ))}

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Anything else?
              </label>
              <textarea
                id="notes"
                className="input resize-none"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleContinue}
              disabled={!isStepValid()}
              className="btn-primary"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isStepValid() || loading}
              className="btn-primary"
            >
              {loading ? 'Sending…' : 'Request booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingForm
