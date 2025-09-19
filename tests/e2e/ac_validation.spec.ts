import { test, expect } from '@playwright/test'
import { resetTasks } from './_helpers'

test.describe('TDA-S-006 Validation & errors (contract)', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-016] 空/空白のみ title は 400 {error:"TITLE_REQUIRED"}、UIは #new_task 近傍に role="alert" 表示', async ({ page }) => {
    await page.goto('/')
    const input = page.locator('#new_task')
    await input.fill('   ')
    await input.press('Enter')
    // UI should surface API 400 error and show role="alert" near the input
    await expect(page.locator('div[role="alert"]')).toBeVisible()
  })

  test('[AC: TDA-003-API] 未存在 :id の PATCH は 404 {error:"TASK_NOT_FOUND"}', async ({ request, baseURL }) => {
    const res = await request.patch(`${baseURL}/api/tasks/does-not-exist`, {
      headers: { 'content-type': 'application/json' },
      data: { done: true },
    })
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'TASK_NOT_FOUND' })
  })

  test('[AC: TDA-004-API] 未存在 :id の DELETE は 404 {error:"TASK_NOT_FOUND"}', async ({ request, baseURL }) => {
    const res = await request.delete(`${baseURL}/api/tasks/does-not-exist`)
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'TASK_NOT_FOUND' })
  })

  test('[AC: TDA-003-API] 非boolean の done は 400 {error:"DONE_REQUIRED"}', async ({ request, baseURL }) => {
    const res = await request.patch(`${baseURL}/api/tasks/some-id`, {
      headers: { 'content-type': 'application/json' },
      data: { done: 'yes' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'DONE_REQUIRED' })
  })
})
