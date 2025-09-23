import { test, expect } from '@playwright/test'

test.describe('MVP-003: Place Move (API)', () => {
  test('QGM-010/QGM-011/QGM-012 — success places stone, switches turn, increments count with probability assignment', async ({ request }) => {
    const createRes = await request.post('/api/quantum-gomoku/games', { headers: { 'content-type': 'application/json' }, data: {} })
    expect(createRes.status()).toBe(201)
    const { gameId, gameState: created } = await createRes.json()

    const moveRes = await request.post(`/api/quantum-gomoku/games/${gameId}/moves`, {
      headers: { 'content-type': 'application/json' },
      data: { playerId: created.currentPlayer, position: { row: 7, col: 7 } },
    })
    expect(moveRes.status(), await moveRes.text()).toBe(200)
    const after = (await moveRes.json()) as { gameState: any }
    expect(after.gameState.turnCount).toBe(1)
    expect(after.gameState.currentPlayer).toBe('WHITE')
    expect(after.gameState.board[7][7]).not.toBeNull()
    expect(after.gameState.board[7][7].placedBy).toBe('BLACK')
    expect(after.gameState.board[7][7].probabilityType).toBe('P90')

    // WHITE plays; probability P10
    const move2 = await request.post(`/api/quantum-gomoku/games/${gameId}/moves`, {
      headers: { 'content-type': 'application/json' },
      data: { playerId: 'WHITE', position: { row: 7, col: 8 } },
    })
    expect(move2.status()).toBe(200)
    const after2 = (await move2.json()) as { gameState: any }
    expect(after2.gameState.turnCount).toBe(2)
    expect(after2.gameState.currentPlayer).toBe('BLACK')
    expect(after2.gameState.board[7][8].probabilityType).toBe('P10')
  })

  test('QGM-013/QGM-014/QGM-015 — errors do not mutate state', async ({ request }) => {
    const createRes = await request.post('/api/quantum-gomoku/games', { headers: { 'content-type': 'application/json' }, data: {} })
    expect(createRes.status()).toBe(201)
    const { gameId } = await createRes.json()

    // Invalid position
    const badPos = await request.post(`/api/quantum-gomoku/games/${gameId}/moves`, {
      headers: { 'content-type': 'application/json' }, data: { playerId: 'BLACK', position: { row: 99, col: 0 } },
    })
    expect(badPos.status()).toBe(400)
    const badPosBody = await badPos.json()
    expect(badPosBody).toHaveProperty('code', 'INVALID_POSITION')

    // Out of turn (still BLACK's turn initially, simulate WHITE)
    const oot = await request.post(`/api/quantum-gomoku/games/${gameId}/moves`, {
      headers: { 'content-type': 'application/json' }, data: { playerId: 'WHITE', position: { row: 0, col: 0 } },
    })
    expect(oot.status()).toBe(409)
    const ootBody = await oot.json()
    expect(ootBody).toHaveProperty('code', 'OUT_OF_TURN')

    // Valid move then try to occupy same cell → 400 CELL_OCCUPIED
    const ok = await request.post(`/api/quantum-gomoku/games/${gameId}/moves`, {
      headers: { 'content-type': 'application/json' }, data: { playerId: 'BLACK', position: { row: 0, col: 0 } },
    })
    expect(ok.status()).toBe(200)

    const occupied = await request.post(`/api/quantum-gomoku/games/${gameId}/moves`, {
      headers: { 'content-type': 'application/json' }, data: { playerId: 'WHITE', position: { row: 0, col: 0 } },
    })
    expect(occupied.status()).toBe(400)
    const occBody = await occupied.json()
    expect(occBody).toHaveProperty('code', 'CELL_OCCUPIED')
  })
})

