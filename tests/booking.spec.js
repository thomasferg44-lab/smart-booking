import { test, expect } from '@playwright/test'
import { companyConfig } from '../src/companyConfig.js'

const today = new Date().toISOString().split('T')[0]

const catByMode = (mode) => companyConfig.services.find((c) => c.bookingMode === mode)

const mockSubmit = (page, { ok = true } = {}) =>
  page.route('**/.netlify/functions/submit-booking', async (route) => {
    await route.fulfill(
      ok
        ? { status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, bookingId: 'test-123' }) }
        : { status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) },
    )
  })

const cont = (page) => page.getByRole('button', { name: 'Continue' }).click()

test('page loads with tagline', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(companyConfig.tagline)
})

test('category selection gates Continue', async ({ page }) => {
  await page.goto('/')
  const continueBtn = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn).toBeDisabled()

  const cat = catByMode('datetime')
  await page.getByRole('button', { name: cat.label }).click()
  await expect(continueBtn).toBeEnabled()
})

test('datetime flow shows price and completes (mocked submit)', async ({ page }) => {
  await mockSubmit(page)
  const cat = catByMode('datetime')
  const option = cat.options[0]

  await page.goto('/')
  await page.getByRole('button', { name: cat.label }).click()
  await cont(page)

  // Option step shows the option with its KYD/USD price badge.
  await page.getByRole('button', { name: option.name }).click()
  await expect(page.getByText('KYD $').first()).toBeVisible()
  await cont(page)

  // Adaptive details: date + time.
  await page.fill('#date', today)
  await page.getByRole('button', { name: companyConfig.timeSlots[0] }).click()
  await cont(page)

  // Customer details.
  await page.fill('#name', 'Jane Doe')
  await page.fill('#email', 'jane@example.com')
  await cont(page)

  // Review → submit.
  await page.getByRole('button', { name: 'Request booking' }).click()
  await expect(page.getByRole('heading', { name: "You're on the list!" })).toBeVisible()
})

test('weeks flow requires at least one week', async ({ page }) => {
  const cat = catByMode('weeks')
  await page.goto('/')
  await page.getByRole('button', { name: cat.label }).click()
  await cont(page)
  await page.getByRole('button', { name: cat.options[0].name }).click()
  await cont(page)

  // On the weeks step, Continue is disabled until a week is picked.
  const continueBtn = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn).toBeDisabled()
  await page.getByRole('button', { name: cat.weekOptions[0].label }).click()
  await expect(continueBtn).toBeEnabled()
})

test('fixed flow shows schedule and needs no date/time', async ({ page }) => {
  const cat = catByMode('fixed')
  await page.goto('/')
  await page.getByRole('button', { name: cat.label }).click()
  await cont(page)
  await page.getByRole('button', { name: cat.options[0].name }).click()
  await cont(page)

  // Details step is read-only schedule info — no date input, Continue enabled.
  await expect(page.locator('#date')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Continue' })).toBeEnabled()
})

test('level flow: pick level then option', async ({ page }) => {
  const cat = catByMode('level')
  const level = cat.levels[0]
  await page.goto('/')
  await page.getByRole('button', { name: cat.label }).click()
  await cont(page)

  // Continue disabled until both level and option chosen.
  const continueBtn = page.getByRole('button', { name: 'Continue' })
  await expect(continueBtn).toBeDisabled()
  await page.getByRole('button', { name: level.label }).click()
  await page.getByRole('button', { name: level.options[0].name }).click()
  await expect(continueBtn).toBeEnabled()
})

test('error message appears on failed submit', async ({ page }) => {
  await mockSubmit(page, { ok: false })
  const cat = catByMode('datetime')

  await page.goto('/')
  await page.getByRole('button', { name: cat.label }).click()
  await cont(page)
  await page.getByRole('button', { name: cat.options[0].name }).click()
  await cont(page)
  await page.fill('#date', today)
  await page.getByRole('button', { name: companyConfig.timeSlots[0] }).click()
  await cont(page)
  await page.fill('#name', 'Jane Doe')
  await page.fill('#email', 'jane@example.com')
  await cont(page)
  await page.getByRole('button', { name: 'Request booking' }).click()

  await expect(page.getByText('Server error')).toBeVisible()
})
