import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const current = await getCurrentUser(request)
  if (!current) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const subscription = body.subscription
  if (!subscription || typeof subscription.endpoint !== 'string') {
    return NextResponse.json({ error: 'invalid_subscription' }, { status: 400 })
  }

  const user = await (prisma.user as any).findUnique({
    where: { id: current.id },
    select: { pushSubscriptions: true },
  })

  const existing = Array.isArray(user?.pushSubscriptions) ? user?.pushSubscriptions : []
  const unique = Array.from(
    new Map(existing.concat(subscription).map((item: any) => [item.endpoint, item])).values()
  )

  await (prisma.user as any).update({
    where: { id: current.id },
    data: { pushSubscriptions: unique },
  })

  return NextResponse.json({ ok: true })
}
