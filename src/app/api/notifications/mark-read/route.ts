import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request)
  if (!current) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : []

  if (ids.length > 0) {
    await prisma.notification.updateMany({
      where: { userId: current.id, id: { in: ids } },
      data: { isRead: true },
    })
  } else {
    await prisma.notification.updateMany({
      where: { userId: current.id, isRead: false },
      data: { isRead: true },
    })
  }

  const unreadCount = await prisma.notification.count({
    where: { userId: current.id, isRead: false },
  })

  return NextResponse.json({ ok: true, unreadCount })
}
