import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subscribe } from '@/lib/supportStream'
import { getErrorMessage } from '@/lib/errors'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  // simple SSE using ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (_) { /** ignore */ }
      }

      const unsub = subscribe(id, (payload) => send({ type: 'message', payload }))

      // send initial state: last 100 messages
      prisma.chatMessage.findMany({ where: { chatRoomId: id }, orderBy: { createdAt: 'asc' }, include: { sender: true }, take: 100 })
        .then(list => send({ type: 'initial', payload: list }))
        .catch(() => { /* ignore */ })

      // cleanup on cancel
      ;(controller as unknown as { oncancel?: () => void }).oncancel = () => { unsub() }
    }
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } })
}
