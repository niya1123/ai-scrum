import { randomUUID } from 'crypto'
import type { Task } from '../index'
import type { TaskStore } from '../ports/taskStore'

export class MemoryTaskStore implements TaskStore {
  private tasks: Task[] = []

  list(): Task[] {
    return [...this.tasks].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0))
  }

  create(title: string): Task {
    const now = new Date().toISOString()
    const task: Task = { id: randomUUID(), title, done: false, createdAt: now }
    this.tasks.push(task)
    return task
  }

  updateDone(id: string | number, done: boolean): Task | null {
    const idx = this.tasks.findIndex(t => String(t.id) === String(id))
    if (idx === -1) return null
    this.tasks[idx] = { ...this.tasks[idx], done }
    return this.tasks[idx]
  }

  delete(id: string | number): boolean {
    const len = this.tasks.length
    this.tasks = this.tasks.filter(t => String(t.id) !== String(id))
    return this.tasks.length !== len
  }
}

