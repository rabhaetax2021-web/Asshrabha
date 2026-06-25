import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publish } from '@/lib/supportStream'
import { getErrorMessage } from '@/lib/errors'

async function resolveParams(p: unknown): Promise<Record<string, unknown> | undefined> {
  if (p && typeof (p as { then?: Function }).then === 'function') {
    try { return await (p as Promise<Record<string, unknown>>) } catch { return undefined }
  }
  return p as Record<string, unknown> | undefined
}

export async function GET(request: NextRequest, context: { params: Promise<Record<string, unknown>> }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const params = await context.params
  const id = params?.id as string | undefined
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const messages = await prisma.chatMessage.findMany({ where: { chatRoomId: String(id) }, orderBy: { createdAt: 'asc' }, include: { sender: true } })
  return NextResponse.json({ ok: true, messages })
}

export async function POST(request: NextRequest, context: { params: Promise<Record<string, unknown>> }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const paramsResolved = await context.params
  const id = paramsResolved?.id as string | undefined
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const body = await request.json() as Record<string, unknown>
  const content = body?.content as string | undefined
  if (!content) return NextResponse.json({ error: 'missing content' }, { status: 400 })

  try {
    const msg = await prisma.chatMessage.create({ data: { chatRoomId: id, senderId: current.id, content } })
    // Re-fetch with sender relation so SSE subscribers get complete data
    const msgWithSender = await prisma.chatMessage.findUnique({
      where: { id: msg.id },
      include: { sender: true }
    })
    // publish to in-process subscribers (SSE / admin clients)
    try { publish(id, msgWithSender || msg) } catch (_) { /** best-effort */ }
    return NextResponse.json({ ok: true, message: msgWithSender || msg })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
