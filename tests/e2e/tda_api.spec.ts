import { expect, test } from '@playwright/test'
import { createTask, listTasks, resetTasks, type Task } from './_helpers'

const jsonHeaders = { 'content-type': 'application/json' }

async function delay(ms: number) {
  await new Promise(resolve => setTimeout(resolve, ms))
}

test.describe('Tasks API acceptance', () => {
  test.beforeEach(async ({ request, baseURL }) => {
    await resetTasks(request, baseURL)
  })

  test('[AC: TDA-001-AC1] POST /api/tasks trims title and returns task meta', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/tasks`, {
      data: { title: '  Sample Task  ' },
      headers: jsonHeaders,
    })

    expect(res.status()).toBe(201)
    expect((res.headers()['content-type'] || '')).toContain('application/json')

    const body = (await res.json()) as Task
    expect(typeof body.id).toBe('string')
    expect(body.title).toBe('Sample Task')
    expect(body.done).toBe(false)
    expect(typeof body.createdAt).toBe('string')
    expect(Number.isNaN(Date.parse(body.createdAt))).toBe(false)

    const tasks = await listTasks(request, baseURL)
    expect(tasks[0].title).toBe('Sample Task')
    expect(tasks[0].done).toBe(false)
  })

  test('[AC: TDA-001-AC2] POST /api/tasks rejects blank titles with 400 TITLE_REQUIRED', async ({ request, baseURL }) => {
    const res = await request.post(`${baseURL}/api/tasks`, {
      data: { title: '   ' },
      headers: jsonHeaders,
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'TITLE_REQUIRED' })

    const tasks = await listTasks(request, baseURL)
    expect(tasks).toHaveLength(0)
  })

  test('[AC: TDA-002-AC1] GET /api/tasks returns task array with expected schema and order', async ({ request, baseURL }) => {
    const older = await createTask(request, 'older task', baseURL)
    await delay(10)
    const newer = await createTask(request, 'newer task', baseURL)

    const res = await request.get(`${baseURL}/api/tasks`)
    expect(res.status()).toBe(200)
    expect((res.headers()['content-type'] || '')).toContain('application/json')

    const data = (await res.json()) as Task[]
    expect(Array.isArray(data)).toBe(true)
    expect(data.length).toBeGreaterThanOrEqual(2)

    for (const item of data) {
      expect(typeof item.id === 'string' || typeof item.id === 'number').toBe(true)
      expect(typeof item.title).toBe('string')
      expect(typeof item.done).toBe('boolean')
      expect(typeof item.createdAt).toBe('string')
      expect(Number.isNaN(Date.parse(item.createdAt))).toBe(false)
    }

    expect(data[0].title).toBe(newer.title)
    expect(new Date(data[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(data[1].createdAt).getTime()
    )
    expect(data.some(t => t.id === older.id)).toBe(true)
  })

  test('[AC: TDA-003-AC1] PATCH /api/tasks/:id updates done flag per request', async ({ request, baseURL }) => {
    const task = await createTask(request, 'toggle target', baseURL)

    const toDone = await request.patch(`${baseURL}/api/tasks/${task.id}`, {
      data: { done: true },
      headers: jsonHeaders,
    })
    expect(toDone.status()).toBe(200)
    const doneBody = (await toDone.json()) as Task
    expect(doneBody.done).toBe(true)

    const tasksAfterDone = await listTasks(request, baseURL)
    expect(tasksAfterDone.find(t => t.id === task.id)?.done).toBe(true)

    const toUndone = await request.patch(`${baseURL}/api/tasks/${task.id}`, {
      data: { done: false },
      headers: jsonHeaders,
    })
    expect(toUndone.status()).toBe(200)
    const undoneBody = (await toUndone.json()) as Task
    expect(undoneBody.done).toBe(false)
  })

  test('[AC: TDA-003-AC2] PATCH /api/tasks/:id requires boolean done', async ({ request, baseURL }) => {
    const task = await createTask(request, 'validation', baseURL)

    const res = await request.patch(`${baseURL}/api/tasks/${task.id}`, {
      data: { done: 'yes' },
      headers: jsonHeaders,
    })

    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body).toEqual({ error: 'DONE_REQUIRED' })
  })

  test('[AC: TDA-003-AC4] PATCH non-existent task returns 404 TASK_NOT_FOUND', async ({ request, baseURL }) => {
    const res = await request.patch(`${baseURL}/api/tasks/non-existent-id`, {
      data: { done: true },
      headers: jsonHeaders,
    })

    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'TASK_NOT_FOUND' })
  })

  test('[AC: TDA-004-AC1] DELETE /api/tasks/:id removes task and returns ok:true', async ({ request, baseURL }) => {
    const first = await createTask(request, 'keep me', baseURL)
    const second = await createTask(request, 'remove me', baseURL)

    const res = await request.delete(`${baseURL}/api/tasks/${second.id}`)
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true })

    const tasks = await listTasks(request, baseURL)
    expect(tasks.some(t => t.id === first.id)).toBe(true)
    expect(tasks.some(t => t.id === second.id)).toBe(false)
  })

  test('[AC: TDA-004-AC3] DELETE non-existent task returns 404 TASK_NOT_FOUND', async ({ request, baseURL }) => {
    const res = await request.delete(`${baseURL}/api/tasks/non-existent-id`)

    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body).toEqual({ error: 'TASK_NOT_FOUND' })
  })
})
