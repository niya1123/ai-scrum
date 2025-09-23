import { NextResponse } from 'next/server'
import { getGameService, isValidUUID, invalidId } from '@qgomoku'

export const runtime = 'nodejs'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  if (!isValidUUID(id)) {
    return NextResponse.json(invalidId('Invalid game id', { id }), { status: 400 })
  }
  let body: any
  try {
    body = await req.json()
  } catch {
    body = {}
  }
  const playerId = body?.playerId
  const seed = typeof body?.seed === 'number' ? body.seed : undefined
  const svc = getGameService()
  const result = svc.observe(id, { playerId, seed })
  if (result.error) return NextResponse.json(result.error, { status: errorStatus(result.error.code) })
  return NextResponse.json(result, { status: 200 })
}

function errorStatus(code: string): number {
  switch (code) {
    case 'NOT_FOUND': return 404
    case 'GAME_OVER': return 409
    case 'OBS_NOT_ALLOWED': return 409
    case 'OBS_LIMIT_EXCEEDED': return 409
    default: return 400
  }
}

