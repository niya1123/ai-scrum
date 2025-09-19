import { test, expect } from '@playwright/test'
import { listTasks, resetTasks } from './_helpers'

test.describe('TDA-S-003 Create task (UI + API)', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-009] #new_task に入力し Enter で POST（title は trim）', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('#new_task')
    await input.fill('  Buy milk  ')
    await input.press('Enter')
    await expect(page.locator('[role="listitem"]').first()).toContainText('Buy milk')
  })

  test('[AC: TDA-010] 201でTask返却→一覧先頭に追加・入力クリア', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('#new_task')
    await input.fill('Task X')
    await input.press('Enter')
    await expect(page.locator('[role="listitem"]').first()).toContainText('Task X')
    await expect(input).toHaveValue('')
  })

  test('[AC: TDA-011] 生成Taskは done=false で createdAt はサーバ側付与', async ({ page, request, baseURL }) => {
    await page.goto('/')
    await page.locator('#new_task').fill('Check server props')
    await page.locator('#new_task').press('Enter')
    const tasks = await listTasks(request, baseURL)
    expect(tasks.length).toBeGreaterThan(0)
    const first = tasks[0]
    expect(first.done).toBe(false)
    expect(typeof first.createdAt).toBe('string')
    expect(Number.isNaN(Date.parse(first.createdAt))).toBeFalsy()
  })
})

