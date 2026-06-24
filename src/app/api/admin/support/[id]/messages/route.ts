import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { publish } from '@/lib/supportStream'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let id: string | undefined
  try { id = (await params)?.id } catch (e) {}
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const messages = await prisma.chatMessage.findMany({ where: { chatRoomId: id }, orderBy: { createdAt: 'asc' }, include: { sender: true } })
  return NextResponse.json({ ok: true, messages })
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  let id: string | undefined
  try { id = (await params)?.id } catch (e) {}
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const content = body?.content
  if (!content) return NextResponse.json({ error: 'missing content' }, { status: 400 })

  const msg = await prisma.chatMessage.create({ data: { chatRoomId: id, senderId: current.id, content } })
  // Re-fetch with sender relation so SSE subscribers get complete data
  const msgWithSender = await prisma.chatMessage.findUnique({
    where: { id: msg.id },
    include: { sender: true }
  })
  try { publish(id, msgWithSender || msg) } catch (e) { }
  return NextResponse.json({ ok: true, message: msgWithSender || msg })
}
