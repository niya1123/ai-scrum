import type { APIRequestContext } from '@playwright/test'

export type Task = {
  id: string | number
  title: string
  done: boolean
  createdAt: string
}

function resolveBaseURL(baseURL?: string) {
  if (baseURL) return baseURL
  const port = process.env.PORT || '3000'
  const envBase = process.env.BASE_URL || `http://localhost:${port}`
  return envBase
}

export async function listTasks(request: APIRequestContext, baseURL?: string): Promise<Task[]> {
  const url = `${resolveBaseURL(baseURL)}/api/tasks`
  const res = await request.get(url)
  if (!res.ok()) throw new Error(`Failed to list tasks: ${res.status()}`)
  const data = (await res.json()) as Task[]
  return data
}

export async function createTask(request: APIRequestContext, title: string, baseURL?: string): Promise<Task> {
  const url = `${resolveBaseURL(baseURL)}/api/tasks`
  const res = await request.post(url, {
    data: { title },
    headers: { 'content-type': 'application/json' },
  })
  if (res.status() !== 201) {
    const body = await res.text()
    throw new Error(`Failed to create task: ${res.status()} ${body}`)
  }
  return (await res.json()) as Task
}

export async function deleteTask(request: APIRequestContext, id: string | number, baseURL?: string): Promise<void> {
  const url = `${resolveBaseURL(baseURL)}/api/tasks/${id}`
  const res = await request.delete(url)
  if (!res.ok()) throw new Error(`Failed to delete task ${id}: ${res.status()}`)
}

export async function resetTasks(request: APIRequestContext, baseURL?: string): Promise<void> {
  const tasks = await listTasks(request, baseURL).catch(() => [])
  for (const t of tasks) {
    try {
      await deleteTask(request, t.id, baseURL)
    } catch {
      // ignore
    }
  }
}

