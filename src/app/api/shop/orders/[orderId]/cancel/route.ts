import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolvedParams = await params
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.orderId },
    select: { id: true, customerId: true, status: true },
  })

  if (!order || order.customerId !== current.id) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status !== 'PENDING') {
    return NextResponse.json({ error: 'Only pending orders can be cancelled' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: order.id, customerId: current.id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ ok: true, order: updated })
}
