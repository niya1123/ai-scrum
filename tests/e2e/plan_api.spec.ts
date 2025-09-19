import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

const samplesDir = path.join(process.cwd(), 'docs', 'samples', 'api')

function readJson<T = any>(file: string): T {
  const p = path.join(samplesDir, file)
  return JSON.parse(fs.readFileSync(p, 'utf-8')) as T
}

test.describe('POST /api/plan (contract)', () => {
  test('happy path: 200 + json + Trip shape + inclusive days (<3s)', async ({ request, baseURL }) => {
    const payload = readJson('plan.request.valid.json')

    const start = Date.now()
    const res = await request.post(`${baseURL}/api/plan`, {
      data: payload,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    })
    const elapsed = Date.now() - start

    expect(res.status(), 'status 200').toBe(200)
    expect(res.headers()['content-type']).toContain('application/json')

    const body = await res.json()
    // Basic Trip shape
    expect(typeof body.destination).toBe('string')
    expect(typeof body.startDate).toBe('string')
    expect(typeof body.endDate).toBe('string')
    expect(Array.isArray(body.days)).toBe(true)

    // Inclusive date range check
    const [s, e] = [payload.start_date, payload.end_date]
    const msPerDay = 24 * 60 * 60 * 1000
    const expectedDays = Math.floor((Date.parse(e) - Date.parse(s)) / msPerDay) + 1
    expect(body.days.length).toBe(expectedDays)
    for (const d of body.days) {
      expect(typeof d.date).toBe('string')
      expect(Array.isArray(d.items)).toBe(true)
      expect(d.items.length).toBeGreaterThan(0)
    }

    // Performance budget
    expect(elapsed).toBeLessThanOrEqual(3000)
  })

  test('400: destination required', async ({ request, baseURL }) => {
    const payload = readJson('plan.request.missing-destination.json')
    const res = await request.post(`${baseURL}/api/plan`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(Array.isArray(body.errors)).toBe(true)
    const first = body.errors[0]
    expect(first.field).toBe('destination')
    expect(first.code).toBe('required')
  })

  test('400: date format', async ({ request, baseURL }) => {
    const payload = readJson('plan.request.invalid-date-format.json')
    const res = await request.post(`${baseURL}/api/plan`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(Array.isArray(body.errors)).toBe(true)
    // At least one offending field must have format code
    expect(body.errors.some((e: any) => e.code === 'format')).toBeTruthy()
  })

  test('400: date order (start_date <= end_date)', async ({ request, baseURL }) => {
    const payload = readJson('plan.request.date-range-order-invalid.json')
    const res = await request.post(`${baseURL}/api/plan`, {
      data: payload,
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(Array.isArray(body.errors)).toBe(true)
    expect(body.errors.some((e: any) => e.field === 'date_range' && e.code === 'order')).toBeTruthy()
  })
})

