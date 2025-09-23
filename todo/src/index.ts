export interface Task {
  id: string | number
  title: string
  done: boolean
  createdAt: string // ISO8601
}

export type { TaskStore } from './ports/taskStore'
export { MemoryTaskStore } from './adapters/memoryTaskStore'

