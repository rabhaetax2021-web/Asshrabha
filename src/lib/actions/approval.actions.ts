import { prisma } from '@/lib/prisma'
import { createNotification } from './notification.actions'

export type ApprovalRequestData = Record<string, unknown>

export async function submitApprovalRequest(params: {
  type: string
  providerId: string
  orderId?: string
  orderItemId?: string
  productId?: string
  reason?: string
  data?: ApprovalRequestData
  submittedBy?: string
}) {
  const { type, providerId, orderId, orderItemId, productId, reason, data, submittedBy } = params

  const req = await prisma.approvalRequest.create({
    data: {
      type: type as any,
      providerId,
      orderId: orderId || null,
      orderItemId: orderItemId || null,
      productId: productId || null,
      reason: reason || null,
      data: (data || null) as any,
      submittedBy: submittedBy || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: submittedBy || providerId,
      action: 'SUBMIT_APPROVAL_REQUEST',
      entity: 'ApprovalRequest',
      entityId: req.id,
      details: { type, orderId, orderItemId, productId, reason, data } as any,
    },
  })

  // mark order as pending modification approval if applicable
  if (orderId) {
    try {
      await prisma.order.update({ where: { id: orderId }, data: { status: 'PENDING_MODIFICATION_APPROVAL' as any } })
    } catch (err) {
      // ignore if status cannot be set for some reason
      console.error('failed to mark order pending modification', err)
    }
  }

  // notify admin + customer via simple notification record
  try {
    if (orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, select: { customerId: true, orderNumber: true } })
      const note = typeof reason === 'string' && reason.trim() ? reason.trim() : undefined
      const noteText = note ? ` Note: ${note}` : ''
      const payloadBase = {
        orderId,
        orderNumber: order?.orderNumber,
        providerId,
        bodyEN: `A provider requested an update for order ${order?.orderNumber ?? orderId}.${noteText}`,
        bodyAR: `طلب مزود تعديلًا على الطلب ${order?.orderNumber ?? orderId}.${noteText}`,
      }

      if (order?.customerId) {
        await createNotification(
          order.customerId,
          'ORDER_MODIFICATION_REQUEST',
          'Order modification requested',
          'تم طلب تعديل على الطلب',
          {
            ...payloadBase,
            bodyEN: `A provider requested an update for order ${order.orderNumber ?? orderId}.${noteText}`,
            bodyAR: `طلب مزود تعديلًا على الطلب ${order.orderNumber ?? orderId}.${noteText}`,
          }
        )
      }

      const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
      await Promise.all(
        admins.map((admin) =>
          createNotification(
            admin.id,
            'ORDER_MODIFICATION_REQUEST',
            'Order modification requested',
            'تم طلب تعديل على الطلب',
            {
              ...payloadBase,
              bodyEN: `Provider requested an update for order ${order?.orderNumber ?? orderId}.${noteText}`,
              bodyAR: `طلب مزود تعديلًا على الطلب ${order?.orderNumber ?? orderId}.${noteText}`,
            }
          )
        )
      )
    }
  } catch (err) {
    console.error('notify failure', err)
  }

  return req
}

export async function applyApproval(requestId: string, adminId: string, approve: boolean, comment?: string) {
  const req = await prisma.approvalRequest.findUnique({ where: { id: requestId } })
  if (!req) throw new Error('not_found')

  const provider = await prisma.providerProfile.findUnique({ where: { id: req.providerId }, select: { userId: true } })
  const order = req.orderId ? await prisma.order.findUnique({ where: { id: req.orderId }, select: { customerId: true, orderNumber: true } }) : null

  if (!approve) {
    await prisma.approvalRequest.update({ where: { id: requestId }, data: { state: 'REJECTED', reviewedBy: adminId, comments: { adminComment: comment } as any, resolvedAt: new Date() } })
    await prisma.auditLog.create({ data: { userId: adminId, action: 'REJECT_APPROVAL_REQUEST', entity: 'ApprovalRequest', entityId: requestId, details: { comment } } })

    if (provider?.userId) {
      await createNotification(
        provider.userId,
        'ORDER_MODIFICATION_REJECTED',
        'Order modification rejected',
        'تم رفض تعديل الطلب',
        {
          requestId,
          orderId: req.orderId,
          orderNumber: order?.orderNumber,
          bodyEN: `Your order modification request for ${order?.orderNumber ?? req.orderId ?? 'the order'} was rejected. ${comment ?? ''}`,
          bodyAR: `تم رفض طلب تعديل الطلب ${order?.orderNumber ?? req.orderId ?? ''}. ${comment ?? ''}`,
        }
      )
    }
    if (order?.customerId) {
      await createNotification(
        order.customerId,
        'ORDER_MODIFICATION_REJECTED',
        'Order modification rejected',
        'تم رفض تعديل الطلب',
        {
          requestId,
          orderId: req.orderId,
          orderNumber: order.orderNumber,
          bodyEN: `The requested update for order ${order.orderNumber} was rejected by admin. ${comment ?? ''}`,
          bodyAR: `تم رفض التعديل المطلوب للطلب ${order.orderNumber} من قبل الإدارة. ${comment ?? ''}`,
        }
      )
    }

    return { ok: true }
  }

  const notifyApproval = async () => {
    if (provider?.userId) {
      await createNotification(
        provider.userId,
        'ORDER_MODIFICATION_APPROVED',
        'Order modification approved',
        'تمت الموافقة على تعديل الطلب',
        {
          requestId,
          orderId: req.orderId,
          orderNumber: order?.orderNumber,
          bodyEN: `Your order modification request for ${order?.orderNumber ?? req.orderId ?? 'the order'} was approved by admin. ${comment ?? ''}`,
          bodyAR: `تمت الموافقة على طلب تعديل الطلب ${order?.orderNumber ?? req.orderId ?? ''} من قبل الإدارة. ${comment ?? ''}`,
        }
      )
    }
    if (order?.customerId) {
      await createNotification(
        order.customerId,
        'ORDER_MODIFICATION_APPROVED',
        'Order modification approved',
        'تمت الموافقة على تعديل الطلب',
        {
          requestId,
          orderId: req.orderId,
          orderNumber: order.orderNumber,
          bodyEN: `An order modification request for ${order.orderNumber} was approved by admin. ${comment ?? ''}`,
          bodyAR: `تمت الموافقة على طلب تعديل الطلب ${order.orderNumber} من قبل الإدارة. ${comment ?? ''}`,
        }
      )
    }
  }

  // Approve – apply changes depending on type
  if (req.type === 'ORDER_QUANTITY_REDUCTION') {
    const d = req.data as any
    const itemId = req.orderItemId
    const newQty = d?.newQuantity
    if (itemId && typeof newQty === 'number') {
      const item = await prisma.orderItem.findUnique({ where: { id: itemId } })
      if (item) {
        const updated = await prisma.orderItem.update({ where: { id: itemId }, data: { quantity: newQty, totalPrice: (item.unitPrice || item.totalPrice / item.quantity) * newQty } as any })
        const items = await prisma.orderItem.findMany({ where: { orderId: item.orderId } })
        const total = items.reduce((s, it) => s + (it.totalPrice || 0), 0)
        await prisma.order.update({ where: { id: item.orderId }, data: { totalAmount: total } })
        await prisma.auditLog.create({ data: { userId: adminId, action: 'APPLY_QUANTITY_REDUCTION', entity: 'OrderItem', entityId: itemId, details: { before: item, after: updated, approvalId: requestId } } })
        await notifyApproval()
        return { ok: true }
      }
    }
  }

  if (req.type === 'ORDER_PRODUCT_REMOVAL') {
    const itemId = req.orderItemId
    if (itemId) {
      const item = await prisma.orderItem.findUnique({ where: { id: itemId } })
      if (item) {
        await prisma.orderItem.delete({ where: { id: itemId } })
        const items = await prisma.orderItem.findMany({ where: { orderId: item.orderId } })
        const total = items.reduce((s, it) => s + (it.totalPrice || 0), 0)
        await prisma.order.update({ where: { id: item.orderId }, data: { totalAmount: total } })
        try {
          const pp = await prisma.providerProduct.findUnique({ where: { id: item.providerProductId }, select: { id: true } })
          if (pp) {
            await prisma.providerProduct.update({ where: { id: pp.id }, data: { status: 'REQUIRES_ADMIN_REAPPROVAL' as any } })
          }
        } catch (e) {
          console.error('failed to update provider product status', e)
        }
        await prisma.auditLog.create({ data: { userId: adminId, action: 'APPLY_PRODUCT_REMOVAL', entity: 'OrderItem', entityId: itemId, details: { before: item, approvalId: requestId } } })
        await notifyApproval()
        return { ok: true }
      }
    }
  }

  await prisma.approvalRequest.update({ where: { id: requestId }, data: { state: 'APPROVED', reviewedBy: adminId, comments: { adminComment: comment } as any, resolvedAt: new Date() } })
  await prisma.auditLog.create({ data: { userId: adminId, action: 'APPLY_APPROVAL_GENERIC', entity: 'ApprovalRequest', entityId: requestId, details: { approval: req } } })
  await notifyApproval()
  return { ok: true }
}

export async function listPendingApprovals(limit = 50) {
  return await prisma.approvalRequest.findMany({ where: { state: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: limit, include: { provider: true } })
}
