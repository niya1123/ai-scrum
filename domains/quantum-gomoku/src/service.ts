import { randomUUID } from 'node:crypto'
import type { GameRepository } from './ports/gameRepository'
import type { GameState, PlayerId } from './types'
import { createEmptyBoard, INITIAL_OBSERVATIONS, BOARD_SIZE } from './types'
import { cellOccupied, gameOver, invalidPosition, notFound, obsLimitExceeded, obsNotAllowed, outOfTurn } from './errors'

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

  observe(
    id: string,
    params: { playerId: PlayerId; seed?: number }
  ): { observationResult?: any; gameState?: GameState; error?: ReturnType<typeof notFound> | ReturnType<typeof gameOver> | ReturnType<typeof obsNotAllowed> | ReturnType<typeof obsLimitExceeded> } {
    const game = this.repo.get(id)
    if (!game) return { error: notFound('Game not found', { id }) }
    if (game.status !== 'playing') return { error: gameOver('Game is over') }

    const { playerId, seed } = params
    if (game.lastMover !== playerId) {
      return { error: obsNotAllowed('Observation allowed only to last mover', { lastMover: game.lastMover, playerId }) }
    }
    const remKey = playerId === 'BLACK' ? 'blackObservationsRemaining' : 'whiteObservationsRemaining'
    if (game[remKey] <= 0) return { error: obsLimitExceeded('No observations remaining', { playerId }) }

    const rng = makeRng(seed)
    const observedBoard = game.board.map(row => row.map(cell => {
      if (!cell) return null
      const pBlack = probToBlack(cell.probabilityType)
      const r = rng()
      const observedColor: PlayerId = r < pBlack ? 'BLACK' : 'WHITE'
      return { ...cell, observedColor }
    }))

    const blackWin = hasLine(observedBoard, 'BLACK', 3)
    const whiteWin = hasLine(observedBoard, 'WHITE', 3)
    let winner: PlayerId | null = null
    if (blackWin && whiteWin) winner = playerId
    else if (blackWin) winner = 'BLACK'
    else if (whiteWin) winner = 'WHITE'

    game[remKey] = Math.max(0, game[remKey] - 1)

    let winningLine: Array<{ row: number; col: number }> | undefined
    if (winner) {
      winningLine = anyWinningLine(observedBoard, winner, 3)
      game.status = 'finished'
      game.winner = winner
      game.board = observedBoard
    } else {
      // Revert to unobserved
      game.board = game.board.map(row => row.map(cell => (cell ? { ...cell, observedColor: null } : null)))
    }

    // Draw check after observation
    if (!winner && game.blackObservationsRemaining === 0 && game.whiteObservationsRemaining === 0 && isBoardFull(game.board)) {
      game.status = 'draw'
    }

    this.repo.save(game)
    const observationResult = {
      id: randomUUID(),
      observedBy: playerId,
      turnExecuted: game.turnCount,
      resultBoard: observedBoard,
      isWinning: Boolean(winner),
      winner,
      winningLine,
    }
    return { observationResult, gameState: game }
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

function probToBlack(p: 'P90'|'P70'|'P30'|'P10'): number {
  switch (p) {
    case 'P90': return 0.9
    case 'P70': return 0.7
    case 'P30': return 0.3
    case 'P10': return 0.1
  }
}

function anyWinningLine(board: GameState['board'], color: PlayerId, need = 3): Array<{row:number; col:number}> | undefined {
  const dirs = [ [0,1], [1,0], [1,1], [1,-1] ] as const
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      for (const [dr, dc] of dirs) {
        let coords: Array<{row:number; col:number}> = []
        for (let k = 0; k < need; k++) {
          const rr = r + dr*k, cc = c + dc*k
          if (rr < 0 || cc < 0 || rr >= BOARD_SIZE || cc >= BOARD_SIZE) { coords = []; break }
          const cell = board[rr][cc]
          if (!cell || cell.observedColor !== color) { coords = []; break }
          coords.push({ row: rr, col: cc })
        }
        if (coords.length === need) return coords
      }
    }
  }
  return undefined
}

function hasLine(board: GameState['board'], color: PlayerId, need = 3): boolean {
  return Boolean(anyWinningLine(board, color, need))
}

function isBoardFull(board: GameState['board']): boolean {
  for (const row of board) for (const cell of row) if (!cell) return false
  return true
}

function makeRng(seed?: number): () => number {
  if (typeof seed !== 'number' || !Number.isFinite(seed)) return Math.random
  let s = (seed >>> 0) || 1
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}
