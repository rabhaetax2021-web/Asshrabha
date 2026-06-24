import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

const VALID_STATUSES = ['PENDING','CONFIRMED','SHIPPED','DELIVERED','COMPLETED','CANCELLED','REFUNDED']

export async function PUT(request: Request, context: { params: any }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const { params } = context
    const id = params.id
    const body = await request.json()
    let status = (body?.status || '').toString().toUpperCase()
    // Accept legacy 'PAID' label and map to CONFIRMED
    if (status === 'PAID') status = 'CONFIRMED'
    if (!status) return NextResponse.json({ error: 'missing status' }, { status: 400 })
    if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: 'invalid status' }, { status: 400 })

    const prev = await prisma.order.findUnique({ where: { id }, select: { status: true } })
    if (!prev) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (prev.status === status) {
      return NextResponse.json({ ok: true, order: prev })
    }

    const order = await prisma.order.update({ where: { id }, data: { status } })
    // Record status history
    await prisma.orderStatusHistory.create({ data: { orderId: id, status, changedBy: current.id, note: body?.note || null } })

    return NextResponse.json({ ok: true, order })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

