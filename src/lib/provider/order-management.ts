import { prisma } from '@/lib/prisma'
import { calculateOrderTotals } from '@/lib/order-pricing'

export type ProviderOrderModificationAction = 'REDUCE_QUANTITY' | 'REMOVE_PRODUCT' | 'MARK_UNAVAILABLE'

export async function applyProviderOrderModification(params: {
  providerId: string
  orderId: string
  orderItemId: string
  action: ProviderOrderModificationAction
  userId: string
  newQuantity?: number
  reason?: string
}) {
  const { providerId, orderId, orderItemId, action, userId, newQuantity, reason } = params

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true, totalAmount: true, providerId: true } })
  if (!order || order.providerId !== providerId) {
    return { ok: false, error: 'forbidden' }
  }

  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: {
      id: true,
      orderId: true,
      quantity: true,
      unitPrice: true,
      totalPrice: true,
      providerProductId: true,
    },
  })

  if (!item || item.orderId !== orderId) {
    return { ok: false, error: 'invalid_item' }
  }

  const providerProduct = await prisma.providerProduct.findUnique({
    where: { id: item.providerProductId },
    select: { id: true, providerId: true },
  })

  if (!providerProduct || providerProduct.providerId !== providerId) {
    return { ok: false, error: 'invalid_item' }
  }

  if (action === 'REDUCE_QUANTITY') {
    if (typeof newQuantity !== 'number' || newQuantity <= 0 || newQuantity >= (item.quantity || 0)) {
      return { ok: false, error: 'invalid_quantity' }
    }

    const previousQuantity = item.quantity
    const nextTotalPrice = (item.unitPrice || 0) * newQuantity
    await prisma.providerProduct.update({
      where: { id: item.providerProductId },
      data: { status: 'REQUIRES_RE_REGISTRATION' as any, stockQuantity: 0 },
    })
    const updatedItem = await prisma.orderItem.update({
      where: { id: item.id },
      data: { quantity: newQuantity, totalPrice: nextTotalPrice },
    })

    const totals = await calculateOrderTotals(prisma, orderId, providerId)
    await prisma.order.update({ where: { id: orderId }, data: { totalAmount: totals.totalAmount } })
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROVIDER_ORDER_QUANTITY_CHANGED',
        entity: 'OrderItem',
        entityId: item.id,
        details: {
          orderId,
          previousQuantity,
          newQuantity,
          removedProducts: [],
          timestamp: new Date().toISOString(),
          providerAction: 'REDUCE_QUANTITY',
          reason: reason || null,
          providerProductStatus: 'REQUIRES_RE_REGISTRATION',
        },
      },
    })

    return { ok: true, item: updatedItem }
  }

  if (action === 'REMOVE_PRODUCT') {
    const previousQuantity = item.quantity
    await prisma.providerProduct.update({
      where: { id: item.providerProductId },
      data: { status: 'REQUIRES_RE_REGISTRATION' as any, stockQuantity: 0 },
    })
    const updatedItem = await prisma.orderItem.update({
      where: { id: item.id },
      data: { quantity: 0, totalPrice: 0 },
    })

    const totals = await calculateOrderTotals(prisma, orderId, providerId)
    await prisma.order.update({ where: { id: orderId }, data: { totalAmount: totals.totalAmount } })
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROVIDER_ORDER_PRODUCT_REMOVED',
        entity: 'OrderItem',
        entityId: item.id,
        details: {
          orderId,
          previousQuantity,
          newQuantity: 0,
          removedProducts: [{ orderItemId: item.id, providerProductId: item.providerProductId, quantity: previousQuantity }],
          timestamp: new Date().toISOString(),
          providerAction: 'REMOVE_PRODUCT',
          reason: reason || null,
          providerProductStatus: 'REQUIRES_RE_REGISTRATION',
        },
      },
    })

    return { ok: true, item: updatedItem }
  }

  if (action === 'MARK_UNAVAILABLE') {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'PROVIDER_ORDER_MARKED_UNAVAILABLE',
        entity: 'OrderItem',
        entityId: item.id,
        details: {
          orderId,
          previousQuantity: item.quantity,
          newQuantity: item.quantity,
          removedProducts: [],
          timestamp: new Date().toISOString(),
          providerAction: 'MARK_UNAVAILABLE',
          reason: reason || null,
        },
      },
    })

    return { ok: true }
  }

  return { ok: false, error: 'unknown_action' }
}

export async function reRegisterProviderProduct(params: { providerId: string; providerProductId: string; userId: string }) {
  const { providerId, providerProductId, userId } = params
  const product = await prisma.providerProduct.findUnique({
    where: { id: providerProductId },
    select: { id: true, providerId: true, status: true },
  })

  if (!product || product.providerId !== providerId) {
    return { ok: false, error: 'forbidden' }
  }

  if (product.status !== 'REQUIRES_RE_REGISTRATION' && product.status !== 'CONSUMED') {
    return { ok: false, error: 'invalid_status' }
  }

  const updated = await prisma.providerProduct.update({
    where: { id: providerProductId },
    data: { status: 'ACTIVE' as any },
  })

  await prisma.auditLog.create({
    data: {
      userId,
      action: 'PROVIDER_PRODUCT_RE_REGISTERED',
      entity: 'ProviderProduct',
      entityId: providerProductId,
      details: {
        previousStatus: product.status,
        newStatus: 'ACTIVE',
        timestamp: new Date().toISOString(),
      },
    },
  })

  return { ok: true, product: updated }
}
