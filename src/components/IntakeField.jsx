function IntakeField({ field, value, onChange, primaryColor }) {
  const { id, label, type, required, placeholder, options = [] } = field

  let input

  switch (type) {
    case 'text':
      input = (
        <input
          id={id}
          type="text"
          className="input"
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case 'textarea':
      input = (
        <textarea
          id={id}
          className="input resize-none"
          rows={3}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case 'select':
      input = (
        <select
          id={id}
          className="input"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Select an option
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
      break

    case 'radio':
      input = (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const selected = value === option
            return (
              <button
                key={option}
                type="button"
                onClick={() => onChange(option)}
                className="px-4 py-2 rounded-full border text-sm transition"
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
                {option}
              </button>
            )
          })}
        </div>
      )
      break

    case 'checkbox': {
      const values = Array.isArray(value) ? value : []
      const toggle = (option) => {
        if (values.includes(option)) {
          onChange(values.filter((v) => v !== option))
        } else {
          onChange([...values, option])
        }
      }
      input = (
        <div className="flex flex-col gap-2">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                className="w-4 h-4"
                style={{ accentColor: primaryColor }}
                checked={values.includes(option)}
                onChange={() => toggle(option)}
              />
              {option}
            </label>
          ))}
        </div>
      )
      break
    }

    default:
      input = null
  }

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {input}
    </div>
  )
}

export default IntakeField
