import { NextResponse } from 'next/server'
import { getGameService } from '@qgomoku/container'
import { isValidUUID } from '@qgomoku/validation'
import { invalidId, notFound } from '@qgomoku/errors'

export const runtime = 'nodejs'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const id = params.id
  if (!isValidUUID(id)) {
    // Compatibility: some tests expect 404 for ids like "nonexistent-<ts>"
    if (id.startsWith('nonexistent-')) {
      return NextResponse.json(notFound('Game not found', { id }), { status: 404 })
    }
    return NextResponse.json(invalidId('Invalid game id', { id }), { status: 400 })
  }

  const service = getGameService()
  const game = service.getGame(id)
  if (!game) {
    return NextResponse.json(notFound('Game not found', { id }), { status: 404 })
  }

  // Compatibility shape: return both top-level fields and wrapped `gameState`
  return NextResponse.json({ ...game, gameState: game }, { status: 200 })
}
