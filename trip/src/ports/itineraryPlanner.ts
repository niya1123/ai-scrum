import type { Trip } from '../index'

export type PlannerParams = {
  destination: string
  startDate: string
  endDate: string
}

export interface ItineraryPlanner {
  generateTrip(params: PlannerParams): Trip
}

