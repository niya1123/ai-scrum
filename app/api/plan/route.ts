import { NextRequest } from 'next/server'
import { validatePlanInput, type Trip } from 'src/domain/trip'
import { getItineraryPlanner } from '@/lib/container'

export const runtime = 'nodejs'

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const body = await req.json().catch(() => ({}))
    const validation = validatePlanInput(body)
    if (!validation.ok) {
      return new Response(JSON.stringify({ errors: validation.errors }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { destination, startDate, endDate } = validation.data
    const planner = getItineraryPlanner()
    const trip: Trip = planner.generateTrip({ destination, startDate, endDate })

    return new Response(JSON.stringify(trip), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    // Do not leak internals
    return new Response(JSON.stringify({ errors: [{ code: 'internal_error' }] }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
