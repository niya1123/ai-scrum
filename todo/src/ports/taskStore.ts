import type { Task } from '../index'

export interface TaskStore {
  list(): Task[]
  create(title: string): Task
  updateDone(id: string | number, done: boolean): Task | null
  delete(id: string | number): boolean
}

