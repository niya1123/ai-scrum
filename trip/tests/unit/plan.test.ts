import test from 'node:test'
import assert from 'node:assert/strict'

import { validatePlanInput } from '@/domain/trip'
import { simpleItineraryPlanner } from '@/adapters/simpleItineraryPlanner'

const validPayload = {
  destination: 'Kyoto',
  start_date: '2025-01-05',
  end_date: '2025-01-07',
}

test('[TPA-001][TPA-002] accepts valid payload and normalises keys', () => {
  const result = validatePlanInput(validPayload)
  assert.equal(result.ok, true)
  if (result.ok) {
    assert.deepEqual(result.data, {
      destination: 'Kyoto',
      startDate: '2025-01-05',
      endDate: '2025-01-07',
    })
  }
})

test('[TPA-003] planner generates inclusive days with items', () => {
  const { destination, startDate, endDate } = ((): { destination: string; startDate: string; endDate: string } => {
    const result = validatePlanInput(validPayload)
    assert.equal(result.ok, true)
    if (!result.ok) {
      throw new Error('Expected validation to pass for known valid payload')
    }
    return result.data
  })()

  const trip = simpleItineraryPlanner.generateTrip({ destination, startDate, endDate })
  assert.equal(trip.destination, destination)
  assert.equal(trip.days.length, 3)
  assert.deepEqual(
    trip.days.map((day) => day.date),
    ['2025-01-05', '2025-01-06', '2025-01-07'],
  )
  assert.ok(trip.days.every((day) => day.items.length >= 1), 'Each day should have at least one recommendation')
})

test('[TPA-004][TPA-008] validation reports required and ordering issues', () => {
  const result = validatePlanInput({
    destination: '   ',
    start_date: '2025-01-07',
    end_date: '2025-01-05',
  })
  assert.equal(result.ok, false)
  if (result.ok) return

  assert.deepEqual(result.errors, [
    { field: 'destination', code: 'required', message: 'destination is required' },
    { field: 'date_range', code: 'order', message: 'start_date must be <= end_date' },
  ])
})

test('[TPA-007] invalid date formats flagged precisely', () => {
  const result = validatePlanInput({
    destination: 'Osaka',
    start_date: '2025/01/05',
    end_date: '2025-1-09',
  })
  assert.equal(result.ok, false)
  if (result.ok) return

  assert.deepEqual(result.errors, [
    { field: 'start_date', code: 'format', message: 'Must be YYYY-MM-DD' },
    { field: 'end_date', code: 'format', message: 'Must be YYYY-MM-DD' },
  ])
})

test('[TPA-005][TPA-006] missing fields return required codes', () => {
  const result = validatePlanInput({})
  assert.equal(result.ok, false)
  if (result.ok) return

  assert.deepEqual(result.errors, [
    { field: 'destination', code: 'required', message: 'destination is required' },
    { field: 'start_date', code: 'required', message: 'start_date is required' },
    { field: 'end_date', code: 'required', message: 'end_date is required' },
  ])
})
