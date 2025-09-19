import type { Trip } from '../domain/trip'

export type PlannerParams = {
  destination: string
  startDate: string
  endDate: string
}

export interface ItineraryPlanner {
  generateTrip(params: PlannerParams): Trip
}

