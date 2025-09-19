"use client"
import { useState } from 'react'
import type { Trip } from 'src/domain/trip'

type FieldErrors = Record<string, string>

export default function TripPlannerPage() {
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [trip, setTrip] = useState<Trip | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setTrip(null)
    try {
      const resp = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ destination, start_date: startDate, end_date: endDate }),
      })
      if (resp.ok) {
        const data: Trip = await resp.json()
        setTrip(data)
      } else if (resp.status === 400) {
        const data = await resp.json()
        const fe: FieldErrors = {}
        for (const e of data.errors ?? []) {
          if (e.field) fe[e.field] = e.code
        }
        setErrors(fe)
      } else {
        setErrors({ general: 'internal_error' })
      }
    } catch {
      setErrors({ general: 'network_error' })
    } finally {
      setSubmitting(false)
    }
  }

  const requiredFields = ['destination', 'start_date', 'end_date'] as const
  const hasAnyRequired = requiredFields.some((f) => (errors as any)[f] === 'required')
  const aggregatedMessages = [
    hasAnyRequired ? 'required' : null,
    errors.date_range ? `date_range: ${errors.date_range}` : null,
    errors.general ? `general: ${errors.general}` : null,
  ].filter(Boolean)
  const aggregatedText = aggregatedMessages.join(' | ')

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Trip Planner</h1>
      <form onSubmit={onSubmit} aria-describedby="form-errors" noValidate>
        <div
          id="form-errors"
          style={{ color: 'crimson', marginBottom: '0.75rem', minHeight: '1.25rem' }}
          {...(aggregatedText ? { role: 'alert', 'aria-live': 'assertive' as const } : {})}
        >
          {aggregatedText || ' '}
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="destination">destination</label>
          <input
            id="destination"
            name="destination"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.destination) || undefined}
            aria-describedby={errors.destination ? 'err-destination' : undefined}
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          {errors.destination && (
            <div id="err-destination" style={{ color: 'crimson' }}>
              {errors.destination}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="start_date">start_date</label>
          <input
            id="start_date"
            name="start_date"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.start_date) || undefined}
            aria-describedby={errors.start_date ? 'err-start_date' : undefined}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          {errors.start_date && (
            <div id="err-start_date" style={{ color: 'crimson' }}>
              {errors.start_date}
            </div>
          )}
        </div>

        <div style={{ marginBottom: '0.75rem' }}>
          <label htmlFor="end_date">end_date</label>
          <input
            id="end_date"
            name="end_date"
            type="text"
            required
            aria-required="true"
            aria-invalid={Boolean(errors.end_date) || undefined}
            aria-describedby={errors.end_date ? 'err-end_date' : undefined}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {errors.end_date && (
            <div id="err-end_date" style={{ color: 'crimson' }}>
              {errors.end_date}
            </div>
          )}
        </div>

        {/* date_range is summarized above in form-errors */}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Planning…' : 'Plan Trip'}
        </button>
      </form>

      <section role="region" aria-label="result" style={{ marginTop: '1rem' }}>
        <h2>Result</h2>
        {trip ? (
          <div>
            <div>
              {trip.destination}: {trip.startDate} → {trip.endDate} ({trip.days.length} days)
            </div>
            <ul>
              {trip.days.map((d) => (
                <li key={d.date} data-testid="day">
                  <strong>{d.date}</strong>
                  <ul>
                    {d.items.map((it, i) => (
                      <li key={i}>{it}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div>No result yet.</div>
        )}
      </section>
    </main>
  )
}
