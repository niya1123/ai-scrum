import { NextResponse } from 'next/server'
import { getGameService } from '@qgomoku/container'

export const runtime = 'nodejs'

export async function POST() {
  const service = getGameService()
  const { gameId, gameState } = service.createGame()
  return NextResponse.json({ gameId, gameState }, { status: 201 })
}

