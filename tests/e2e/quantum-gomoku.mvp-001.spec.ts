import { test, expect } from '@playwright/test'

test.describe('MVP-001: Quantum Gomoku — create and get game', () => {
  test('QGM-001/QGM-002/QGM-003/QGM-004/QGM-005', async ({ request }) => {
    // Create a new game
    const createRes = await request.post('/api/quantum-gomoku/games', {
      headers: { 'content-type': 'application/json' },
      data: {},
    })
    expect(createRes.status(), 'POST should return 201').toBe(201)
    const createBody = await createRes.json()

    // shape checks
    expect(createBody).toHaveProperty('gameId')
    expect(createBody).toHaveProperty('gameState')
    const { gameId, gameState } = createBody as any

    // AC checks for initial state
    expect(gameState.status).toBe('playing')
    expect(gameState.currentPlayer).toBe('BLACK')
    expect(gameState.winner).toBe(null)
    expect(gameState.turnCount).toBe(0)
    expect(gameState.blackObservationsRemaining).toBe(5)
    expect(gameState.whiteObservationsRemaining).toBe(5)

    // board should be 15x15 and all empty (null)
    expect(Array.isArray(gameState.board)).toBe(true)
    expect(gameState.board.length).toBe(15)
    for (const row of gameState.board) {
      expect(Array.isArray(row)).toBe(true)
      expect(row.length).toBe(15)
      for (const cell of row) expect(cell).toBe(null)
    }

    // GET the same game
    const getRes = await request.get(`/api/quantum-gomoku/games/${gameId}`)
    expect(getRes.status(), 'GET should return 200').toBe(200)
    const getBody = await getRes.json()
    expect(getBody).toHaveProperty('gameState')
    const fetched = (getBody as any).gameState
    expect(fetched.id).toBe(gameId)
    expect(fetched.status).toBe('playing')
    expect(fetched.turnCount).toBe(0)

    // GET non-existing id (valid UUID v4 → 404 NOT_FOUND)
    const nfRes = await request.get('/api/quantum-gomoku/games/00000000-0000-4000-8000-000000000000')
    expect(nfRes.status(), 'GET non-existing should be 404').toBe(404)
    const nf = await nfRes.json()
    expect(nf).toHaveProperty('code', 'NOT_FOUND')
  })
})
