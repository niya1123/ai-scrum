import { test, expect } from '@playwright/test'

test.describe('MVP-002: Quantum Gomoku — invalid id validation', () => {
  test('QA-002: GET invalid id → 400 INVALID_ID', async ({ request }) => {
    const res = await request.get('/api/quantum-gomoku/games/not-a-uuid')
    expect(res.status(), 'GET invalid id should be 400').toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('code', 'INVALID_ID')
  })
})

