import { NextResponse } from 'next/server'
import { getTaskStore } from '@/lib/container'

export const runtime = 'nodejs'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const store = getTaskStore()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'DONE_REQUIRED' }, { status: 400 })
  }

  const { done } = (body as { done?: unknown }) ?? {}
  if (typeof done !== 'boolean') {
    return NextResponse.json({ error: 'DONE_REQUIRED' }, { status: 400 })
  }

  const updated = store.updateDone(params.id, done)
  if (!updated) return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
  return NextResponse.json(updated, { status: 200 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const store = getTaskStore()
  const ok = store.delete(params.id)
  if (!ok) return NextResponse.json({ error: 'TASK_NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
