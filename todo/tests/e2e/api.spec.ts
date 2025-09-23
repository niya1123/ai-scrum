import { test, expect } from '@playwright/test'

test('GET /api/tasks returns JSON array sorted desc', async ({ request, baseURL }) => {
  const res = await request.get(`${baseURL}/api/tasks`)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type']).toContain('application/json')
  const data = (await res.json()) as Array<{ createdAt: string }>
  expect(Array.isArray(data)).toBe(true)
  // Validate desc order if there are at least two entries
  for (let i = 1; i < data.length; i++) {
    const prev = data[i - 1].createdAt
    const cur = data[i].createdAt
    expect(prev >= cur).toBeTruthy()
  }
})

