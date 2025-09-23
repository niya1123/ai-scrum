import type { GameRepository } from '../ports/gameRepository'
import type { GameState } from '../types'

export class MemoryGameRepository implements GameRepository {
  private store = new Map<string, GameState>()

  create(initial: GameState): string {
    this.store.set(initial.id, initial)
    return initial.id
  }

  get(id: string): GameState | undefined {
    return this.store.get(id)
  }

  save(game: GameState): void {
    this.store.set(game.id, game)
  }
}
