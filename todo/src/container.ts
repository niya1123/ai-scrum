import type { TaskStore } from './index'
import { MemoryTaskStore } from './index'

declare global {
  // eslint-disable-next-line no-var
  var __taskStore: TaskStore | undefined
}

export function getTaskStore(): TaskStore {
  if (!globalThis.__taskStore) {
    globalThis.__taskStore = new MemoryTaskStore()
  }
  return globalThis.__taskStore
}

export function resetTaskStore(): void {
  globalThis.__taskStore = undefined
}

