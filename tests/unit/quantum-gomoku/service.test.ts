import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import { GameService } from '@qgomoku/service'
import { MemoryGameRepository } from '@qgomoku/adapters/memoryGameRepository'
import { BOARD_SIZE } from '@qgomoku/types'

describe('Quantum Gomoku — GameService (create/get)', () => {
  it('createGame returns initial state and persists via repo', () => {
    const repo = new MemoryGameRepository()
    const service = new GameService(repo)

    const { gameId, gameState } = service.createGame()

    // id
    assert.equal(typeof gameId, 'string')
    assert.ok(gameId.length > 0)
    assert.equal(gameState.id, gameId)

    // status / players / counters
    assert.equal(gameState.status, 'playing')
    assert.equal(gameState.currentPlayer, 'BLACK')
    assert.equal(gameState.winner, null)
    assert.equal(gameState.turnCount, 0)
    assert.equal(gameState.blackObservationsRemaining, 5)
    assert.equal(gameState.whiteObservationsRemaining, 5)

    // createdAt (ISO-8601)
    assert.equal(typeof gameState.createdAt, 'string')
    assert.ok(!Number.isNaN(Date.parse(gameState.createdAt)))

    // board shape 15x15 all nulls
    assert.equal(Array.isArray(gameState.board), true)
    assert.equal(gameState.board.length, BOARD_SIZE)
    for (const row of gameState.board) {
      assert.equal(Array.isArray(row), true)
      assert.equal(row.length, BOARD_SIZE)
      for (const cell of row) assert.equal(cell, null)
    }

    // retrievable via repo
    const fetched = service.getGame(gameId)
    assert.ok(fetched)
    assert.equal(fetched?.id, gameId)
  })

  it('getGame returns undefined for nonexistent id', () => {
    const repo = new MemoryGameRepository()
    const service = new GameService(repo)
    assert.equal(service.getGame('nope'), undefined)
  })
})

