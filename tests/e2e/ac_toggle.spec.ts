import { test, expect } from '@playwright/test'
import { createTask, listTasks, resetTasks } from './_helpers'

test.describe('TDA-S-004 Toggle task done (UI + API)', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-012] クリックで PATCH /api/tasks/:id {done} → 200、UIは aria-checked 反映', async ({ page, request, baseURL }) => {
    await createTask(request, 'toggle me', baseURL)
    await page.goto('/')
    const item = page.locator('[role="listitem"]').first()
    const checkbox = item.getByRole('checkbox')
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })

  test('[AC: TDA-013] 再クリックで元に戻せる（永続化）', async ({ page, request, baseURL }) => {
    await createTask(request, 'toggle twice', baseURL)
    await page.goto('/')
    const item = page.locator('[role="listitem"]').first()
    const checkbox = item.getByRole('checkbox')
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'true')
    await checkbox.click()
    await expect(checkbox).toHaveAttribute('aria-checked', 'false')
    const tasks = await listTasks(request, baseURL)
    expect(tasks[0].done).toBe(false)
  })
})

