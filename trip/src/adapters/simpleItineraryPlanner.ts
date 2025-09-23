import type { ItineraryPlanner, PlannerParams } from '../ports/itineraryPlanner'
import type { Trip } from '../index'
import { enumerateDates } from '../index'

export const simpleItineraryPlanner: ItineraryPlanner = {
  generateTrip({ destination, startDate, endDate }: PlannerParams): Trip {
    const days = enumerateDates(startDate, endDate).map((date) => ({
      date,
      items: [
        `Explore top sights in ${destination}`,
        `Try local cuisine in ${destination}`,
      ],
    }))
    return {
      destination,
      startDate,
      endDate,
      days,
    }
  },
}

