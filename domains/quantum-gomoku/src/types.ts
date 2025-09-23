export const BOARD_SIZE = 15 as const

export type PlayerId = 'BLACK' | 'WHITE'
export type GameStatus = 'playing' | 'finished' | 'draw'
export type ProbabilityType = 'P90' | 'P70' | 'P30' | 'P10'

export interface Stone {
  placedBy: PlayerId
  turnPlaced: number
  probabilityType: ProbabilityType
  observedColor: PlayerId | null
}

export type Cell = Stone | null
export type Board = Cell[][] // BOARD_SIZE x BOARD_SIZE

export interface GameState {
  id: string
  status: GameStatus
  currentPlayer: PlayerId
  winner: PlayerId | null
  board: Board
  blackObservationsRemaining: number
  whiteObservationsRemaining: number
  turnCount: number
  createdAt: string // ISO8601
  lastMover: PlayerId | null
}

export const INITIAL_OBSERVATIONS = 5

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => null))
}

