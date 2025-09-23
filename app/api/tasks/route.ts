import { NextResponse } from 'next/server'
import { getTaskStore } from '@todo/container'

export const runtime = 'nodejs'

export async function GET() {
  const store = getTaskStore()
  const tasks = store.list()
  return NextResponse.json(tasks, { status: 200 })
}

export async function POST(req: Request) {
  const store = getTaskStore()
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'TITLE_REQUIRED' }, { status: 400 })
  }

  const rawTitle = typeof (body as any)?.title === 'string' ? (body as any).title : ''
  const title = rawTitle.trim()
  if (!title) {
    return NextResponse.json({ error: 'TITLE_REQUIRED' }, { status: 400 })
  }

  const task = store.create(title)
  return NextResponse.json(task, { status: 201 })
}
