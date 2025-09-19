import { test, expect } from '@playwright/test'
import { createTask, listTasks, resetTasks } from './_helpers'

test.describe('TDA-S-001 API — List tasks (Task model)', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-001] GET /api/tasks は 200 と JSON配列', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/api/tasks`)
    expect(res.status()).toBe(200)
    const data = (await res.json()) as unknown
    expect(Array.isArray(data)).toBe(true)
  })

  test('[AC: TDA-004] Content-Type は application/json', async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/api/tasks`)
    expect((res.headers()['content-type'] || '')).toContain('application/json')
  })

  test('[AC: TDA-003] createdAt 降順で返却', async ({ request, baseURL }) => {
    await createTask(request, 'older', baseURL)
    await new Promise(r => setTimeout(r, 10))
    await createTask(request, 'newer', baseURL)
    const list = await listTasks(request, baseURL)
    expect(list.length).toBeGreaterThanOrEqual(2)
    expect(list[0].title).toBe('newer')
    expect(new Date(list[0].createdAt).getTime()).toBeGreaterThanOrEqual(new Date(list[1].createdAt).getTime())
  })

  test('[AC: TDA-002] 各要素の形状: id,title,done,createdAt(ISO8601)', async ({ request, baseURL }) => {
    await createTask(request, 'shape-check', baseURL)
    const list = await listTasks(request, baseURL)
    expect(list.length).toBeGreaterThan(0)
    for (const item of list) {
      expect(item).toHaveProperty('id')
      expect(typeof item.title).toBe('string')
      expect(typeof item.done).toBe('boolean')
      expect(typeof item.createdAt).toBe('string')
      // ISO8601 parseable
      expect(Number.isNaN(Date.parse(item.createdAt))).toBeFalsy()
    }
  })
})

