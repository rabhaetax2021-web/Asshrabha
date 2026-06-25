import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const subject = body?.subject

  // Try to find existing open chat for this user
  const existing = await prisma.chatRoom.findFirst({ where: { isClosed: false, participants: { some: { userId: current.id } } } })
  if (existing) return NextResponse.json({ ok: true, id: existing.id })

  // Create new chat room with optional subject
  const room = await prisma.chatRoom.create({ data: { subject: subject || null } })
  await prisma.chatParticipant.create({ data: { chatRoomId: room.id, userId: current.id } })

  // Try to assign an available admin (best-effort)
  try {
    const admin = await prisma.user.findFirst({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] }, status: 'APPROVED' } })
    if (admin) {
      // Add admin as participant so they can see the room in admin UI
      await prisma.chatParticipant.create({ data: { chatRoomId: room.id, userId: admin.id } })
    }
  } catch (e) {
    // ignore
  }

  return NextResponse.json({ ok: true, id: room.id })
}
