import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED']

export async function PUT(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params
  try {
    const current = await getCurrentUser()
    if (!current?.id) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const provider = await prisma.providerProfile.findFirst({ where: { userId: current.id }, select: { id: true } })
    if (!provider) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const body = await request.json()
    const status = (body?.status || '').toString().toUpperCase()
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })

    const order = await prisma.order.findFirst({ where: { id: orderId, providerId: provider.id }, select: { id: true, status: true } })
    if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 })
    if (order.status === status) return NextResponse.json({ ok: true, order })

    const updated = await prisma.order.update({ where: { id: orderId }, data: { status } })
    await prisma.orderStatusHistory.create({ data: { orderId, status, changedBy: current.id, note: 'Updated by provider' } })
    return NextResponse.json({ ok: true, order: updated })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
