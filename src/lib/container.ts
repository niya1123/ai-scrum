import type { TaskStore } from '@todo'
import { MemoryTaskStore } from '@todo'

declare global {
  // eslint-disable-next-line no-var
  var __taskStore: TaskStore | undefined
}

import type { ItineraryPlanner } from '@trip'
import { simpleItineraryPlanner } from '@trip'

declare global {
  // eslint-disable-next-line no-var
  var __itineraryPlanner: ItineraryPlanner | undefined
}

export function getItineraryPlanner(): ItineraryPlanner {
  if (!globalThis.__itineraryPlanner) {
    globalThis.__itineraryPlanner = simpleItineraryPlanner
  }
  return globalThis.__itineraryPlanner
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
