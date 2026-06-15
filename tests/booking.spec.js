import { test, expect } from '@playwright/test'
import { companyConfig } from '../src/companyConfig.js'

const today = new Date().toISOString().split('T')[0]

const experienceField = companyConfig.intakeFields.find((f) => f.id === 'experience')
const ageGroupField = companyConfig.intakeFields.find((f) => f.id === 'age_group')

const fillStep0 = async (page) => {
  await page.fill('#name', 'Jane Doe')
  await page.fill('#email', 'jane@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
}

const fillStep1 = async (page, { service, timeSlot }) => {
  await page.selectOption('#service', service)
  await page.fill('#date', today)
  await page.getByRole('button', { name: timeSlot }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
}

const fillStep2 = async (page) => {
  await page.selectOption('#experience', experienceField.options[0])
  await page.getByRole('button', { name: ageGroupField.options[0] }).click()
}

test('page loads with tagline', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(companyConfig.tagline)
})

test('step 0 validation', async ({ page }) => {
  await page.goto('/')

  const continueBtn = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn).toBeDisabled()

  await page.fill('#name', 'Jane Doe')
  await page.fill('#email', 'jane@example.com')
  await expect(continueBtn).toBeEnabled()
})

test('step navigation', async ({ page }) => {
  await page.goto('/')

  await fillStep0(page)
  await expect(page.getByRole('heading', { name: 'Book a slot' })).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Your details' })).toBeVisible()
})

test('service dropdown contains all configured services', async ({ page }) => {
  await page.goto('/')
  await fillStep0(page)

  const options = await page.locator('#service option').allTextContents()
  for (const service of companyConfig.services) {
    expect(options).toContain(service)
  }
})

test('time slot selection marks pill as selected', async ({ page }) => {
  await page.goto('/')
  await fillStep0(page)

  const slot = page.getByRole('button', { name: companyConfig.timeSlots[0] })
  await slot.click()
  await expect(slot).toHaveCSS('border-color', 'rgb(33, 183, 181)')
})

test('step 1 validation requires service, date and time', async ({ page }) => {
  await page.goto('/')
  await fillStep0(page)

  const continueBtn = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn).toBeDisabled()

  await page.selectOption('#service', companyConfig.services[0])
  await expect(continueBtn).toBeDisabled()

  await page.fill('#date', today)
  await expect(continueBtn).toBeDisabled()

  await page.getByRole('button', { name: companyConfig.timeSlots[0] }).click()
  await expect(continueBtn).toBeEnabled()
})

test('full form flow with mocked submit', async ({ page }) => {
  await page.route('**/.netlify/functions/submit-booking', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, bookingId: 'test-123' }),
    })
  })

  await page.goto('/')
  await fillStep0(page)
  await fillStep1(page, { service: companyConfig.services[0], timeSlot: companyConfig.timeSlots[0] })
  await fillStep2(page)

  await page.getByRole('button', { name: 'Request booking' }).click()

  await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()
})

test('error message appears on failed submit', async ({ page }) => {
  await page.route('**/.netlify/functions/submit-booking', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Server error' }),
    })
  })

  await page.goto('/')
  await fillStep0(page)
  await fillStep1(page, { service: companyConfig.services[0], timeSlot: companyConfig.timeSlots[0] })
  await fillStep2(page)

  await page.getByRole('button', { name: 'Request booking' }).click()

  const errorBox = page.getByText('Server error')
  await expect(errorBox).toBeVisible()
  await expect(errorBox).toHaveClass(/text-red-700/)
})

test('confirmation page shows booking summary', async ({ page }) => {
  await page.route('**/.netlify/functions/submit-booking', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, bookingId: 'test-123' }),
    })
  })

  const service = companyConfig.services[1]
  const timeSlot = companyConfig.timeSlots[1]

  await page.goto('/')
  await fillStep0(page)
  await fillStep1(page, { service, timeSlot })
  await fillStep2(page)

  await page.getByRole('button', { name: 'Request booking' }).click()

  await expect(page.getByText(service)).toBeVisible()
  await expect(page.getByText(timeSlot)).toBeVisible()
})
