import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subscribeToNotifications } from '@/lib/notificationStream'

export async function GET(request: NextRequest) {
  const current = await getCurrentUser()
  if (!current) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const encoder = new TextEncoder()
  let unsub = () => {}

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch (_) {
          // ignore serialization errors
        }
      }

      unsub = subscribeToNotifications(current.id, (payload) => send({ type: 'notification', payload }))

      try {
        const recent = await prisma.notification.findMany({
          where: { userId: current.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        })

        send({
          type: 'initial',
          payload: recent.map((notification) => ({
            ...notification,
            createdAt: notification.createdAt.toISOString(),
          })),
        })
      } catch {
        // ignore
      }

      ;(controller as unknown as { oncancel?: () => void }).oncancel = () => {
        unsub()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
