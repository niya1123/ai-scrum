import { parseISO, isAfter, isValid, addDays, format } from 'date-fns'
import { z } from 'zod'

export type Day = {
  date: string // YYYY-MM-DD
  items: string[]
}

export type Trip = {
  destination: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  days: Day[]
}

export type PlanInput = {
  destination: string
  start_date: string
  end_date: string
}

const dateRegex = /^\d{4}-\d{2}-\d{2}$/

const baseSchema = z.object({
  destination: z.string().trim().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export function validatePlanInput(payload: any):
  | { ok: true; data: { destination: string; startDate: string; endDate: string } }
  | { ok: false; errors: { field?: string; code: string; message?: string }[] } {
  const errors: { field?: string; code: string; message?: string }[] = []
  baseSchema.safeParse(payload ?? {})

  const destination = String(payload?.destination ?? '').trim()
  const start_date = String(payload?.start_date ?? '')
  const end_date = String(payload?.end_date ?? '')

  if (!destination) errors.push({ field: 'destination', code: 'required', message: 'destination is required' })
  if (!start_date) errors.push({ field: 'start_date', code: 'required', message: 'start_date is required' })
  if (!end_date) errors.push({ field: 'end_date', code: 'required', message: 'end_date is required' })

  if (start_date && !dateRegex.test(start_date)) errors.push({ field: 'start_date', code: 'format', message: 'Must be YYYY-MM-DD' })
  if (end_date && !dateRegex.test(end_date)) errors.push({ field: 'end_date', code: 'format', message: 'Must be YYYY-MM-DD' })

  const sDate = dateRegex.test(start_date) ? parseISO(start_date) : undefined
  const eDate = dateRegex.test(end_date) ? parseISO(end_date) : undefined
  if (sDate && !isValid(sDate)) errors.push({ field: 'start_date', code: 'format', message: 'Must be YYYY-MM-DD' })
  if (eDate && !isValid(eDate)) errors.push({ field: 'end_date', code: 'format', message: 'Must be YYYY-MM-DD' })

  if (sDate && eDate && isAfter(sDate, eDate)) {
    errors.push({ field: 'date_range', code: 'order', message: 'start_date must be <= end_date' })
  }

  if (errors.length > 0) {
    const seen = new Set<string>()
    const dedup = errors.filter((e) => {
      const key = `${e.field ?? ''}|${e.code}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return { ok: false, errors: dedup }
  }

  return {
    ok: true,
    data: { destination, startDate: start_date, endDate: end_date },
  }
}

export function enumerateDates(startDate: string, endDate: string): string[] {
  const start = parseISO(startDate)
  const end = parseISO(endDate)
  const dates: string[] = []
  for (let d = start; !isAfter(d, end); d = addDays(d, 1)) {
    dates.push(format(d, 'yyyy-MM-dd'))
  }
  return dates
}

export type { ItineraryPlanner, PlannerParams } from './ports/itineraryPlanner'
export { simpleItineraryPlanner } from './adapters/simpleItineraryPlanner'

