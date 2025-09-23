import { NextResponse } from 'next/server'
import { getGameService } from '@qgomoku'

export const runtime = 'nodejs'

export async function POST() {
  const svc = getGameService()
  const result = svc.createGame()
  return NextResponse.json(result, { status: 201 })
}

