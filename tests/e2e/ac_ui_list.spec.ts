import { test, expect } from '@playwright/test'
import { createTask, resetTasks } from './_helpers'

test.describe('TDA-S-002 UI — Render task list', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-002-UI] [role="list"][aria-label="tasks"] が存在', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[role="list"][aria-label="tasks"]').first()).toBeVisible()
  })

  test('[AC: TDA-002-UI] 0件時 data-testid="empty-tasks" の空状態を表示', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByTestId('empty-tasks')).toContainText('No tasks yet.')
  })

  test('[AC: TDA-002-UI] 取得タスクが listitem として title 表示', async ({ page, request, baseURL }) => {
    await createTask(request, 'task A', baseURL)
    await createTask(request, 'task B', baseURL)
    await page.goto('/')
    const items = page.locator('[role="listitem"]')
    await expect(items).toHaveCount(2)
    await expect(items.nth(0)).toContainText('task B')
    await expect(items.nth(1)).toContainText('task A')
  })

  test('[AC: TDA-002-UI] 新しい順（createdAt 降順）で表示', async ({ page, request, baseURL }) => {
    await createTask(request, 'older', baseURL)
    await new Promise(r => setTimeout(r, 10))
    await createTask(request, 'newer', baseURL)
    await page.goto('/')
    const items = page.locator('[role="listitem"]')
    await expect(items.first()).toContainText('newer')
  })
})
