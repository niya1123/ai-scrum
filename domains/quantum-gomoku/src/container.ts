import { MemoryGameRepository } from './adapters/memoryGameRepository'
import { GameService } from './service'

declare global {
  // eslint-disable-next-line no-var
  var __qgomokuService: GameService | undefined
}

export function getGameService(): GameService {
  if (!globalThis.__qgomokuService) {
    const repo = new MemoryGameRepository()
    globalThis.__qgomokuService = new GameService(repo)
  }
  return globalThis.__qgomokuService
}

export function resetGameService(): void {
  globalThis.__qgomokuService = undefined
}

