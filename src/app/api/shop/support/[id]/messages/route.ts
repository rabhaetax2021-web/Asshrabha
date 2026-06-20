import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { publish } from '@/lib/supportStream'

export async function GET(request: Request, { params }: any) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const id = (await params)?.id || params?.id
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const messages = await prisma.chatMessage.findMany({ where: { chatRoomId: id }, orderBy: { createdAt: 'asc' }, include: { sender: true } })
  return NextResponse.json({ ok: true, messages })
}

export async function POST(request: Request, { params }: any) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Robustly resolve id: prefer params, fall back to parsing the request URL
  let id = params?.id
  if (!id) {
    try {
      const url = new URL(request.url)
      const parts = url.pathname.split('/').filter(Boolean)
      // expected: ['api','shop','support','{id}','messages']
      if (parts.length >= 5) id = parts[3]
    } catch (e) {
      // ignore
    }
  }
  if (!id) return NextResponse.json({ error: 'missing id', params: params ?? null, pathname: (() => { try { return new URL(request.url).pathname } catch(e){ return null } })() }, { status: 400 })

  const body = await request.json()
  const content = body?.content
  if (!content) return NextResponse.json({ error: 'missing content' }, { status: 400 })

  const msg = await prisma.chatMessage.create({ data: { chatRoomId: id, senderId: current.id, content } })
  // Re-fetch with sender relation so SSE subscribers get complete data
  const msgWithSender = await prisma.chatMessage.findUnique({
    where: { id: msg.id },
    include: { sender: true }
  })
  // publish to in-process subscribers (SSE / admin clients)
  try { publish(id, msgWithSender || msg) } catch (e) { /** best-effort */ }
  return NextResponse.json({ ok: true, message: msgWithSender || msg })
}
