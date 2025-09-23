import { NextResponse } from 'next/server'
import { getGameService } from '@qgomoku/container'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  // Body is currently unused but parsed to ensure JSON content-type compatibility
  try {
    await req.json().catch(() => ({}))
  } catch {
    // Ignore malformed JSON for create; not required for MVP
  }

  const service = getGameService()
  const { gameId, gameState } = service.createGame()
  return NextResponse.json({ gameId, gameState }, { status: 201 })
}

