import { Fragment, useState } from 'react'
import { companyConfig } from '../companyConfig'
import { getCategory, weekLabels } from '../bookingEngine'
import PriceBadge from './PriceBadge'

const STEP_LABELS = ['Service', 'Option', 'Details', 'Your details', 'Review']
const today = new Date().toISOString().split('T')[0]

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const parsed = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return parsed.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function ScheduleNote({ note }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'color-mix(in srgb, var(--color-primary) 7%, transparent)' }}
    >
      <div className="text-sm font-semibold text-gray-900">Schedule</div>
      <div className="text-sm text-gray-600 mt-1">
        {note || 'Your coach will confirm the schedule with you.'}
      </div>
    </div>
  )
}

function DiscountNote({ note }) {
  if (!note) return null
  return (
    <p
      className="text-sm rounded-xl px-4 py-3"
      style={{
        background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
        color: 'color-mix(in srgb, var(--color-accent) 75%, #111)',
      }}
    >
      {note}
    </p>
  )
}

function BookingForm({ onSuccess }) {
  const [step, setStep] = useState(0)
  const [logoError, setLogoError] = useState(false)

  const [categoryId, setCategoryId] = useState('')
  const [levelId, setLevelId] = useState('')
  const [optionId, setOptionId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [weeks, setWeeks] = useState([])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const category = getCategory(categoryId)
  const mode = category?.bookingMode
  const level = category?.levels?.find((l) => l.id === levelId) || null
  const optionList = mode === 'level' ? level?.options || [] : category?.options || []
  const option = optionList.find((o) => o.id === optionId) || null
  // Per-week options multiply by the number of weeks ticked; packages stay flat.
  const selectedPrice =
    option && mode === 'weeks' && !option.isPackage && weeks.length > 0
      ? option.price * weeks.length
      : option?.price ?? 0
  const scheduleNote = level?.scheduleNote || category?.scheduleNote || null
  const emailValid = /\S+@\S+\.\S+/.test(email)

  const chooseCategory = (id) => {
    setCategoryId(id)
    setLevelId('')
    setOptionId('')
    setDate('')
    setTime('')
    setWeeks([])
    setError('')
  }

  const toggleWeek = (id) =>
    setWeeks((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]))

  const isStepValid = () => {
    if (step === 0) return !!categoryId
    if (step === 1) return mode === 'level' ? !!levelId && !!optionId : !!optionId
    if (step === 2) {
      if (mode === 'datetime') return !!date && time.trim() !== ''
      if (mode === 'weeks') return weeks.length > 0
      return true // fixed / level → read-only info
    }
    if (step === 3) return name.trim() !== '' && emailValid
    return true
  }

  const handleContinue = () => {
    setError('')
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1))
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
        body: JSON.stringify({
          name,
          email,
          phone,
          categoryId,
          optionId,
          level: levelId || null,
          selectedWeeks: weeks.length ? weeks : null,
          date: mode === 'datetime' ? date : null,
          time: mode === 'datetime' ? time : null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong. Please try again.')
      }
      onSuccess({
        bookingId: data.bookingId,
        email,
        categoryLabel: category.label,
        optionName: option.name,
        price: selectedPrice,
        isPackage: !!option.isPackage,
        bookingMode: mode,
        date: mode === 'datetime' ? date : null,
        time: mode === 'datetime' ? time : null,
        weeks: weeks.length ? weekLabels(categoryId, weeks) : null,
        level: level?.label || null,
        scheduleNote,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {!logoError && (
        <img
          src={companyConfig.logo}
          alt={companyConfig.name}
          className="h-12 mx-auto mb-2 object-contain"
          onError={() => setLogoError(true)}
        />
      )}
      <h1 className="text-center text-2xl font-semibold tracking-tight text-gray-900 mb-1">
        {companyConfig.name}
      </h1>
      <p className="text-center text-gray-500 mb-8">{companyConfig.tagline}</p>

      {/* Progress */}
      <div className="flex items-center mb-8">
        {STEP_LABELS.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors"
                style={{
                  backgroundColor: i <= step ? 'var(--color-primary)' : '#e5e7eb',
                  color: i <= step ? '#fff' : '#6b7280',
                }}
              >
                {i + 1}
              </div>
              <span className="text-[11px] text-gray-500 mt-1 hidden sm:block">{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className="flex-1 h-0.5 mx-2 transition-colors"
                style={{ backgroundColor: i < step ? 'var(--color-primary)' : '#e5e7eb' }}
              />
            )}
          </Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div key={step} className="step-rise flex flex-col gap-5">
          {/* STEP 0 — Category */}
          {step === 0 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">What would you like to book?</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {companyConfig.services.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => chooseCategory(cat.id)}
                    className="choice-card p-4 text-left"
                    data-selected={categoryId === cat.id}
                  >
                    <div className="font-semibold text-gray-900">{cat.label}</div>
                    {cat.blurb && <div className="text-sm text-gray-500 mt-1">{cat.blurb}</div>}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* STEP 1 — Option (level sub-select first for 'level' mode) */}
          {step === 1 && (
            <>
              {mode === 'level' && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">Choose a level</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {category.levels.map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          setLevelId(l.id)
                          setOptionId('')
                        }}
                        className="choice-card p-4 text-left"
                        data-selected={levelId === l.id}
                      >
                        <div className="font-semibold text-gray-900">{l.label}</div>
                        {l.scheduleNote && (
                          <div className="text-sm text-gray-500 mt-1">{l.scheduleNote}</div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {(mode !== 'level' || levelId) && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {mode === 'level' ? 'Choose an option' : `Choose an option · ${category.label}`}
                  </h2>
                  <div className="flex flex-col gap-3">
                    {optionList.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => setOptionId(o.id)}
                        className="choice-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left"
                        data-selected={optionId === o.id}
                      >
                        <span className="font-medium text-gray-900">{o.name}</span>
                        <PriceBadge price={o.price} isPackage={o.isPackage} />
                      </button>
                    ))}
                  </div>
                  <DiscountNote note={category.discountNote} />
                </>
              )}
            </>
          )}

          {/* STEP 2 — Adaptive details */}
          {step === 2 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">
                {mode === 'datetime' ? 'Pick a date & time' : mode === 'weeks' ? 'Choose your weeks' : 'Schedule'}
              </h2>

              {mode === 'datetime' && (
                <>
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
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred time<span className="text-red-500"> *</span>
                    </label>
                    <input
                      id="time"
                      type="text"
                      className="input"
                      placeholder="e.g. 9:00 AM, 2:30 PM"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                    <p className="mt-1 text-sm text-gray-500">Your coach will confirm availability.</p>
                  </div>
                </>
              )}

              {mode === 'weeks' && (
                <div className="flex flex-col gap-2">
                  {category.weekOptions.map((w) => {
                    const checked = weeks.includes(w.id)
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => toggleWeek(w.id)}
                        className="choice-card p-3 flex items-center gap-3 text-left"
                        data-selected={checked}
                      >
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-white text-xs shrink-0"
                          style={{ backgroundColor: checked ? 'var(--color-primary)' : '#e5e7eb' }}
                        >
                          {checked ? '✓' : ''}
                        </span>
                        <span className="text-gray-900">{w.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {(mode === 'fixed' || mode === 'level') && <ScheduleNote note={scheduleNote} />}
            </>
          )}

          {/* STEP 3 — Customer details */}
          {step === 3 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Your details</h2>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name<span className="text-red-500"> *</span>
                </label>
                <input id="name" type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email<span className="text-red-500"> *</span>
                </label>
                <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input id="phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <>
              <h2 className="text-lg font-semibold text-gray-900">Review &amp; submit</h2>
              <dl className="flex flex-col gap-3">
                <Review label="Service" value={category.label} />
                {level && <Review label="Level" value={level.label} />}
                <Review label="Option" value={option.name} />
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm text-gray-500">Price</dt>
                  <dd>
                    <PriceBadge price={selectedPrice} isPackage={option.isPackage} />
                  </dd>
                </div>
                {mode === 'datetime' && <Review label="When" value={`${formatDate(date)} · ${time}`} />}
                {mode === 'weeks' && weeks.length > 0 && (
                  <Review label="Weeks" value={weekLabels(categoryId, weeks).join(', ')} />
                )}
                {(mode === 'fixed' || mode === 'level') && scheduleNote && (
                  <Review label="Schedule" value={scheduleNote} />
                )}
                <Review label="Name" value={name} />
                <Review label="Email" value={email} />
              </dl>
              <DiscountNote note={category.discountNote} />
            </>
          )}
        </div>

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
          {step < STEP_LABELS.length - 1 ? (
            <button type="button" onClick={handleContinue} disabled={!isStepValid()} className="btn-primary">
              Continue
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={!isStepValid() || loading} className="btn-primary">
              {loading ? 'Sending…' : 'Request booking'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Review({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
    </div>
  )
}

export default BookingForm
