import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(_req: Request, { params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { orderId } = await params
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, customerId: true, status: true } })
  if (!order || order.customerId !== current.id) return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  if (order.status === 'CANCELLED') return NextResponse.json({ ok: true, order })
  if (order.status === 'DELIVERED' || order.status === 'COMPLETED' || order.status === 'SHIPPED') {
    return NextResponse.json({ error: 'This order cannot be cancelled' }, { status: 400 })
  }

  const updated = await prisma.order.update({
    where: { id: orderId, customerId: current.id },
    data: { status: 'CANCELLED' },
  })

  return NextResponse.json({ ok: true, order: updated })
}
