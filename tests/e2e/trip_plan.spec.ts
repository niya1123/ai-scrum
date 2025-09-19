import { test, expect } from '@playwright/test'

test.describe('Trip Planner (Itinerary) MVP', () => {
  test('happy path: generate itinerary within 3s and render in result region', async ({ page }) => {
    await page.goto('/trip')

    await page.getByLabel('destination').fill('Tokyo')
    await page.getByLabel('start_date').fill('2024-01-01')
    await page.getByLabel('end_date').fill('2024-01-03')

    const start = Date.now()
    await page.getByRole('button', { name: 'Plan Trip' }).click()

    const region = page.getByRole('region', { name: 'result' })
    await expect(region).toBeVisible()

    // Ensure 3-day range renders 3 entries.
    await expect(region.getByTestId('day')).toHaveCount(3)

    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThanOrEqual(3000)
  })

  test('validation errors surfaced near fields', async ({ page }) => {
    await page.goto('/trip')
    // Submit empty
    await page.getByRole('button', { name: 'Plan Trip' }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'required' })).toBeVisible()

    // Bad format
    await page.getByLabel('destination').fill('Osaka')
    await page.getByLabel('start_date').fill('2024-13-01')
    await page.getByLabel('end_date').fill('2024-01-01')
    await page.getByRole('button', { name: 'Plan Trip' }).click()
    await expect(page.getByText('format')).toBeVisible()

    // Order error
    await page.getByLabel('start_date').fill('2024-02-02')
    await page.getByLabel('end_date').fill('2024-02-01')
    await page.getByRole('button', { name: 'Plan Trip' }).click()
    await expect(page.getByText('date_range')).toBeVisible()
  })
})

