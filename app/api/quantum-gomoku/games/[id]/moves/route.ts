import { NextResponse } from 'next/server'
import { getGameService } from '@qgomoku/container'
import { isValidUUID } from '@qgomoku/validation'
import { invalidId, notFound } from '@qgomoku/errors'

export const runtime = 'nodejs'

type Params = { params: { id: string } }

export async function POST(req: Request, { params }: Params) {
  const id = params.id
  if (!isValidUUID(id)) {
    return NextResponse.json(invalidId('Invalid game id', { id }), { status: 400 })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ code: 'INVALID_REQUEST', message: 'Invalid JSON body' }, { status: 400 })
  }

  const playerId = body?.playerId
  const position = body?.position
  if (!playerId || (playerId !== 'BLACK' && playerId !== 'WHITE')) {
    return NextResponse.json({ code: 'INVALID_REQUEST', message: 'playerId must be BLACK or WHITE' }, { status: 400 })
  }
  if (
    !position ||
    typeof position.row !== 'number' ||
    typeof position.col !== 'number'
  ) {
    return NextResponse.json({ code: 'INVALID_REQUEST', message: 'position.row and position.col must be numbers' }, { status: 400 })
  }

  const service = getGameService()
  const existing = service.getGame(id)
  if (!existing) {
    return NextResponse.json(notFound('Game not found', { id }), { status: 404 })
  }

  const result = service.placeMove(id, { playerId, position })

  if ('error' in result) {
    const err = result.error
    const status = err.code === 'OUT_OF_TURN' ? 409 : err.code === 'NOT_FOUND' ? 404 : 400
    return NextResponse.json(err, { status })
  }

  return NextResponse.json({ gameState: result.gameState }, { status: 200 })
}

