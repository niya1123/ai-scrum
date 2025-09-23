import type { ItineraryPlanner } from './index'
import { simpleItineraryPlanner } from './index'

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

