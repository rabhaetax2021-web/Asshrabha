import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { subscribe } from '@/lib/supportStream'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let id: string | undefined
  try { id = (await params)?.id } catch (e) {}
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: any) => {
        try { controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`)) } catch (e) { }
      }

      const unsub = subscribe(id, (payload) => send({ type: 'message', payload }))

      // Fetch initial messages — use promise .then to avoid async IIFE in ReadableStream start
      // @ts-ignore — pre-existing type issue with Prisma proxy in sync ReadableStream start
      (prisma as any).chatMessage.findMany({ where: { chatRoomId: id }, orderBy: { createdAt: 'asc' }, include: { sender: true }, take: 100 })
        .then((list: any) => send({ type: 'initial', payload: list }))
        .catch(() => {})

      (controller as any).oncancel = () => { unsub() }
    }
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
