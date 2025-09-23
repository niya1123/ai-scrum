import { NextResponse } from 'next/server'
import { getGameService, notFound, invalidId, isValidUUID } from '@qgomoku'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id
  // Validate id format (UUID v1–v5)
  if (!isValidUUID(id)) {
    return NextResponse.json(
      invalidId('Invalid game id', { id }),
      { status: 400 }
    )
  }

  const svc = getGameService()
  const game = svc.getGame(id)
  if (!game) {
    return NextResponse.json(notFound('Game not found', { id }), { status: 404 })
  }
  return NextResponse.json({ gameState: game }, { status: 200 })
}
