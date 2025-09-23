import type { GameState } from '../types'

export interface GameRepository {
  create(initial: GameState): string
  get(id: string): GameState | undefined
  save(game: GameState): void
}
