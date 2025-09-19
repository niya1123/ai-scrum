import { test, expect } from '@playwright/test'
import { createTask, resetTasks } from './_helpers'

test.describe('TDA-S-005 Delete task (UI + API)', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-004-UI] 各項目に data-testid="delete-task" のボタンを表示', async ({ page, request, baseURL }) => {
    await createTask(request, 'to delete', baseURL)
    await page.goto('/')
    const item = page.locator('[role="listitem"]').first()
    await expect(item.getByTestId('delete-task')).toBeVisible()
  })

  test('[AC: TDA-004-UI] クリックで DELETE /api/tasks/:id → 200 {ok:true}、UIから該当項目削除、0件なら空状態表示', async ({ page, request, baseURL }) => {
    await createTask(request, 'to delete', baseURL)
    await page.goto('/')
    const list = page.locator('[role="list"][aria-label="tasks"]')
    await expect(list.locator('[role="listitem"]')).toHaveCount(1)
    await page.getByTestId('delete-task').click()
    await expect(list.locator('[role="listitem"]')).toHaveCount(0)
    await expect(page.getByTestId('empty-tasks')).toBeVisible()
  })
})
