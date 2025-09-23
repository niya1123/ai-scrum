import test from 'node:test'
import assert from 'node:assert/strict'
import type { Task } from '@/domain/task'
import { resetTaskStore } from '@todo/container'
import { GET, POST } from '../../../../app/api/tasks/route'
import { PATCH, DELETE } from '../../../../app/api/tasks/[id]/route'

const baseUrl = 'http://localhost/api/tasks'

function jsonRequest(url: string, method: string, payload?: unknown): Request {
  const init: RequestInit = {
    method,
    headers: { 'content-type': 'application/json' },
  }

  if (payload !== undefined) {
    init.body = JSON.stringify(payload)
  }

  return new Request(url, init)
}

async function createTask(title: string): Promise<Task> {
  const res = await POST(jsonRequest(baseUrl, 'POST', { title }))
  assert.equal(res.status, 201)
  return (await res.json()) as Task
}

test('POST /api/tasks trims title and returns canonical task', async () => {
  resetTaskStore()

  const res = await POST(jsonRequest(baseUrl, 'POST', { title: '  Sample  ' }))
  assert.equal(res.status, 201)

  const task = (await res.json()) as Task
  assert.equal(task.title, 'Sample')
  assert.equal(task.done, false)
  assert.equal(typeof task.id, 'string')
  assert.equal(new Date(task.createdAt).toISOString(), task.createdAt)
})

test('POST /api/tasks rejects blank or whitespace-only titles', async () => {
  resetTaskStore()

  const res = await POST(jsonRequest(baseUrl, 'POST', { title: '   ' }))
  assert.equal(res.status, 400)

  const payload = (await res.json()) as { error: string }
  assert.deepEqual(payload, { error: 'TITLE_REQUIRED' })
})

test('GET /api/tasks returns tasks sorted by createdAt descending', async () => {
  resetTaskStore()

  await createTask('older')
  await new Promise(resolve => setTimeout(resolve, 5))
  await createTask('newer')

  const res = await GET()
  assert.equal(res.status, 200)

  const tasks = (await res.json()) as Task[]
  assert.equal(tasks.length, 2)
  assert.equal(tasks[0].title, 'newer')
  assert.equal(tasks[1].title, 'older')
})

test('PATCH /api/tasks/:id updates done flag and validates input', async () => {
  resetTaskStore()

  const task = await createTask('toggle me')

  const updateRes = await PATCH(jsonRequest(`${baseUrl}/${task.id}`, 'PATCH', { done: true }), {
    params: { id: String(task.id) },
  })
  assert.equal(updateRes.status, 200)
  const updated = (await updateRes.json()) as Task
  assert.equal(updated.done, true)

  const invalidRes = await PATCH(jsonRequest(`${baseUrl}/${task.id}`, 'PATCH', { done: 'yes' }), {
    params: { id: String(task.id) },
  })
  assert.equal(invalidRes.status, 400)
  const invalidPayload = (await invalidRes.json()) as { error: string }
  assert.deepEqual(invalidPayload, { error: 'DONE_REQUIRED' })

  const missingRes = await PATCH(jsonRequest(`${baseUrl}/missing`, 'PATCH', { done: true }), {
    params: { id: 'missing' },
  })
  assert.equal(missingRes.status, 404)
  const missingPayload = (await missingRes.json()) as { error: string }
  assert.deepEqual(missingPayload, { error: 'TASK_NOT_FOUND' })
})

test('DELETE /api/tasks/:id acknowledges removal and 404 when missing', async () => {
  resetTaskStore()

  const task = await createTask('remove me')

  const deleteRes = await DELETE(new Request(`${baseUrl}/${task.id}`, { method: 'DELETE' }), {
    params: { id: String(task.id) },
  })
  assert.equal(deleteRes.status, 200)
  const deletePayload = (await deleteRes.json()) as { ok: boolean }
  assert.deepEqual(deletePayload, { ok: true })

  const listAfter = await GET()
  const remaining = (await listAfter.json()) as Task[]
  assert.equal(remaining.length, 0)

  const missingRes = await DELETE(new Request(`${baseUrl}/missing`, { method: 'DELETE' }), {
    params: { id: 'missing' },
  })
  assert.equal(missingRes.status, 404)
  const missingPayload = (await missingRes.json()) as { error: string }
  assert.deepEqual(missingPayload, { error: 'TASK_NOT_FOUND' })
})
