import { useEffect, useState } from 'react'
import { companyConfig } from './companyConfig'
import BookingForm from './components/BookingForm'
import ConfirmationPage from './components/ConfirmationPage'

function App() {
  const [submission, setSubmission] = useState(null)

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', companyConfig.primaryColor)
    document.documentElement.style.setProperty('--color-accent', companyConfig.accentColor)
    document.title = companyConfig.tagline
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {submission ? (
        <ConfirmationPage submission={submission} />
      ) : (
        <BookingForm onSuccess={setSubmission} />
      )}
    </div>
  )
}

export default App
