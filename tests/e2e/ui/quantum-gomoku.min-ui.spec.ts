import { test, expect } from '@playwright/test'

test.describe('MVP-008: Quantum Gomoku — minimal UI', () => {
  test('renders 15x15 board, status, and validates existing id', async ({ page }) => {
    await page.goto('/')

    // Board renders (15x15 = 225 gridcells)
    await expect(page.getByTestId('board')).toBeVisible()
    await expect(page.getByRole('gridcell')).toHaveCount(15 * 15)

    // Status bar shows initial values
    const status = page.getByRole('status')
    await expect(status).toContainText('Turn: 0')
    await expect(status).toContainText('Current: BLACK')

    // Existing ID input validation (required + format)
    const input = page.locator('#existing_id')
    const loadBtn = page.getByTestId('load-game')

    // Initially empty → disabled
    await expect(input).toHaveValue('')
    await expect(loadBtn).toBeDisabled()

    // Invalid format keeps button disabled and shows helper text
    await input.fill('not-a-uuid')
    await expect(loadBtn).toBeDisabled()
    await expect(page.locator('#err-existing_id')).toContainText('Invalid format')

    // Use current Game ID from the status bar
    const gameId = await status.locator('code').innerText()
    await input.fill(gameId)
    await expect(loadBtn).toBeEnabled()

    // Submitting same ID succeeds (no error alert)
    await loadBtn.click()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
})

