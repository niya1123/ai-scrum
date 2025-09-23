import { test, expect } from '@playwright/test'

test('renders tasks list container', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('[role="list"][aria-label="tasks"]')).toBeVisible()
})

