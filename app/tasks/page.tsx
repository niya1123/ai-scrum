'use client'

import { useEffect, useState, FormEvent } from 'react'

type Task = {
  id: string | number
  title: string
  done: boolean
  createdAt: string
}

export default function Page() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/tasks', { headers: { 'accept': 'application/json' } })
      const data = (await res.json()) as Task[]
      setTasks(data)
    } catch (e: any) {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  async function createTask(e: FormEvent) {
    e.preventDefault()
    const value = title.trim()
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: value }),
    })
    if (res.status === 201) {
      const task = (await res.json()) as Task
      setTasks(prev => [task, ...prev])
      setTitle('')
      setError(null)
      return
    }
    const err = await res.json().catch(() => ({}))
    setError(err?.error || 'Failed to create task')
  }

  async function toggleDone(t: Task) {
    const res = await fetch(`/api/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ done: !t.done }),
    })
    if (res.ok) {
      const updated = (await res.json()) as Task
      setTasks(prev => prev.map(x => (String(x.id) === String(updated.id) ? updated : x)))
      setError(null)
      return
    }
    const err = await res.json().catch(() => ({}))
    setError(err?.error || 'Failed to toggle task')
  }

  async function deleteTask(t: Task) {
    const res = await fetch(`/api/tasks/${t.id}`, { method: 'DELETE' })
    if (res.ok) {
      setTasks(prev => prev.filter(x => String(x.id) !== String(t.id)))
      setError(null)
      return
    }
    const err = await res.json().catch(() => ({}))
    setError(err?.error || 'Failed to delete task')
  }

  return (
    <main>
      <h1>Tasks</h1>
      <form onSubmit={createTask} style={{ marginBottom: 12 }}>
        <input
          id='new_task'
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder='Add a task and press Enter'
          aria-label='New task title'
          style={{ padding: 8, minWidth: 320 }}
        />
      </form>
      {error && (
        <div role='alert' style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>
      )}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <ul role='list' aria-label='tasks' style={{ listStyle: 'none', padding: 0, minHeight: 1 }}>
            {tasks.map(t => (
              <li key={String(t.id)} role='listitem' style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ddd' }}>
                <button
                  type='button'
                  role='checkbox'
                  aria-checked={t.done}
                  aria-label={t.done ? 'Mark as not done' : 'Mark as done'}
                  onClick={() => toggleDone(t)}
                  style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #888', background: t.done ? '#4caf50' : 'transparent' }}
                />
                <span style={{ textDecoration: t.done ? 'line-through' : 'none' }}>{t.title}</span>
                <span style={{ marginLeft: 'auto', opacity: 0.6, fontSize: 12 }}>{new Date(t.createdAt).toLocaleString()}</span>
                <button
                  type='button'
                  data-testid='delete-task'
                  aria-label='Delete task'
                  onClick={() => deleteTask(t)}
                  style={{ marginLeft: 8 }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
          {tasks.length === 0 && (
            <div data-testid='empty-tasks' role='status' aria-live='polite'>
              No tasks yet.
            </div>
          )}
        </>
      )}
    </main>
  )
}

