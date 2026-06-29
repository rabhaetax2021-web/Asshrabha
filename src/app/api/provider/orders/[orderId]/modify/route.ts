import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { submitApprovalRequest } from '@/lib/actions/approval.actions'

export async function POST(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await context.params
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // provider user must own the provider profile
  const prov = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
  if (!prov) return NextResponse.json({ error: 'not_a_provider' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { action, orderItemId, newQuantity, reason } = body as any

  // verify order belongs to provider
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, providerId: true } })
  if (!order || order.providerId !== prov.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  // verify order item belongs to this provider (providerProduct relation)
  const item = await prisma.orderItem.findUnique({ where: { id: orderItemId }, select: { id: true, providerProduct: { select: { providerId: true } }, orderId: true } }) as any
  if (!item || item.orderId !== orderId || item.providerProduct?.providerId !== prov.id) {
    return NextResponse.json({ error: 'invalid_item' }, { status: 400 })
  }

  if (action === 'REDUCE_QUANTITY') {
    if (typeof newQuantity !== 'number' || newQuantity <= 0 || newQuantity >= (item.quantity || 0)) {
      return NextResponse.json({ error: 'invalid_quantity' }, { status: 400 })
    }

    const req = await submitApprovalRequest({
      type: 'ORDER_QUANTITY_REDUCTION',
      providerId: prov.id,
      orderId: orderId,
      orderItemId: orderItemId,
      reason: reason || null,
      data: { previousQuantity: item.quantity, newQuantity },
      submittedBy: current.id,
    })

    return NextResponse.json({ ok: true, requestId: req.id })
  }

  if (action === 'REMOVE_PRODUCT') {
    const req = await submitApprovalRequest({
      type: 'ORDER_PRODUCT_REMOVAL',
      providerId: prov.id,
      orderId: orderId,
      orderItemId: orderItemId,
      reason: reason || null,
      data: { previousQuantity: item.quantity },
      submittedBy: current.id,
    })
    return NextResponse.json({ ok: true, requestId: req.id })
  }

  if (action === 'MARK_UNAVAILABLE') {
    const req = await submitApprovalRequest({
      type: 'PRODUCT_MODIFICATION',
      providerId: prov.id,
      orderId: orderId,
      orderItemId: orderItemId,
      reason: reason || null,
      data: { mark: 'UNAVAILABLE' },
      submittedBy: current.id,
    })
    return NextResponse.json({ ok: true, requestId: req.id })
  }

  return NextResponse.json({ error: 'unknown_action' }, { status: 400 })
}
