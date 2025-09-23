import { NextResponse } from 'next/server'
import { getGameService } from '@qgomoku/container'
import { invalidId, notFound } from '@qgomoku/errors'
import { isValidUUID } from '@qgomoku/validation'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { id } = params
  if (!isValidUUID(id)) {
    return NextResponse.json(invalidId('id must be a valid UUID'), { status: 400 })
  }

  const service = getGameService()
  const game = service.getGame(id)
  if (!game) return NextResponse.json(notFound('Game not found', { id }), { status: 404 })

  // For broader compatibility with existing tests, return both the raw game
  // state as top-level fields and also under `gameState`.
  return NextResponse.json({ ...game, gameState: game }, { status: 200 })
}

