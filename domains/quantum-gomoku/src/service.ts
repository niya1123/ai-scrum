import { randomUUID } from 'node:crypto'
import type { GameRepository } from './ports/gameRepository'
import type { GameState } from './types'
import { createEmptyBoard, INITIAL_OBSERVATIONS } from './types'

export class GameService {
  constructor(private readonly repo: GameRepository) {}

  createGame(): { gameId: string; gameState: GameState } {
    const id = randomUUID()
    const gameState: GameState = {
      id,
      status: 'playing',
      currentPlayer: 'BLACK',
      winner: null,
      board: createEmptyBoard(),
      blackObservationsRemaining: INITIAL_OBSERVATIONS,
      whiteObservationsRemaining: INITIAL_OBSERVATIONS,
      turnCount: 0,
      createdAt: new Date().toISOString(),
      lastMover: null,
    }

    const gameId = this.repo.create(gameState)
    return { gameId, gameState }
  }

  getGame(id: string): GameState | undefined {
    return this.repo.get(id)
  }
}

