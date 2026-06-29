import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const current = await getCurrentUser()
  if (!current) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: current.id },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  const unreadCount = await prisma.notification.count({
    where: { userId: current.id, isRead: false },
  })

  return NextResponse.json({
    ok: true,
    unreadCount,
    notifications: notifications.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
  })
}
