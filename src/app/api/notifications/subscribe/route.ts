import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser(request)
    const userId = current?.id ? String(current.id).trim() : ''
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const subscription = body.subscription
    if (!subscription || typeof subscription.endpoint !== 'string') {
      return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
    }

    const user = await (prisma.user as any).findUnique({
      where: { id: userId },
      select: { pushSubscriptions: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }

    const existing = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : []
    const unique = Array.from(
      new Map(existing.concat(subscription).map((item: any) => [item.endpoint, item])).values()
    )

    const updateResult = await (prisma.user as any).updateMany({
      where: { id: userId },
      data: { pushSubscriptions: unique },
    })

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[api/notifications/subscribe] error', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'internal_server_error' }, { status: 500 })
  }
}
