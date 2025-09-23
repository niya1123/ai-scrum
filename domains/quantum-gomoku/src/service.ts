import { randomUUID } from 'node:crypto'
import type { GameRepository } from './ports/gameRepository'
import type { GameState, PlayerId } from './types'
import { createEmptyBoard, INITIAL_OBSERVATIONS, BOARD_SIZE } from './types'
import { cellOccupied, invalidPosition, notFound, outOfTurn } from './errors'

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

  placeMove(
    id: string,
    params: { playerId: PlayerId; position: { row: number; col: number } }
  ): { gameState: GameState } | { error: ReturnType<typeof notFound> | ReturnType<typeof outOfTurn> | ReturnType<typeof invalidPosition> | ReturnType<typeof cellOccupied> } {
    const game = this.repo.get(id)
    if (!game) return { error: notFound('Game not found', { id }) }

    const { playerId, position } = params
    // Turn validation
    if (game.currentPlayer !== playerId) {
      return { error: outOfTurn('Move attempted out of turn', { expected: game.currentPlayer, got: playerId }) }
    }

    const { row, col } = position
    // Bounds validation
    if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || col < 0 || row >= BOARD_SIZE || col >= BOARD_SIZE) {
      return { error: invalidPosition('row/col must be integers within 0..14', { row, col }) }
    }

    // Occupancy validation
    if (game.board[row][col] !== null) {
      return { error: cellOccupied('Target cell already occupied', { row, col }) }
    }

    // Determine probabilityType based on player's own prior moves
    const priorMovesByPlayer = countStonesBy(game, playerId)
    const probabilityType = nextProbabilityFor(playerId, priorMovesByPlayer)

    // Apply move (mutate only after all validations pass)
    game.board[row][col] = {
      placedBy: playerId,
      turnPlaced: game.turnCount + 1,
      probabilityType,
      observedColor: null,
    }
    game.turnCount += 1
    game.lastMover = playerId
    game.currentPlayer = playerId === 'BLACK' ? 'WHITE' : 'BLACK'

    this.repo.save(game)
    return { gameState: game }
  }
}

function countStonesBy(game: GameState, player: PlayerId): number {
  let count = 0
  for (let r = 0; r < game.board.length; r++) {
    for (let c = 0; c < game.board[r].length; c++) {
      const cell = game.board[r][c]
      if (cell && cell.placedBy === player) count++
    }
  }
  return count
}

function nextProbabilityFor(player: PlayerId, priorMovesByPlayer: number) {
  if (player === 'BLACK') {
    return priorMovesByPlayer % 2 === 0 ? 'P90' : 'P70'
  }
  return priorMovesByPlayer % 2 === 0 ? 'P10' : 'P30'
}
