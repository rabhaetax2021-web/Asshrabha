import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    approvalRequest: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), findMany: vi.fn() },
    providerProfile: { findUnique: vi.fn() },
    order: { findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    orderItem: { findUnique: vi.fn(), update: vi.fn(), findMany: vi.fn(), delete: vi.fn() },
    providerProduct: { findUnique: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
    user: { findMany: vi.fn() },
    notification: { create: vi.fn() },
  },
}))

import { createNotification } from '../src/lib/actions/notification.actions'
import { submitApprovalRequest, applyApproval } from '../src/lib/actions/approval.actions'
import { prisma } from '../src/lib/prisma'

vi.mock('../src/lib/actions/notification.actions', () => ({
  createNotification: vi.fn(),
}))

describe('approval actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits an order modification request, updates order status, and notifies customer and admins', async () => {
    ;(prisma.approvalRequest.create as any).mockResolvedValue({ id: 'req1' })
    ;(prisma.auditLog.create as any).mockResolvedValue({ id: 'log1' })
    ;(prisma.order.update as any).mockResolvedValue({ id: 'order1', status: 'PENDING_MODIFICATION_APPROVAL' })
    ;(prisma.order.findUnique as any).mockResolvedValue({ customerId: 'cust1', orderNumber: 'ASH-100' })
    ;(prisma.user.findMany as any).mockResolvedValue([{ id: 'admin1' }])
    ;(createNotification as any).mockResolvedValue({ id: 'note1' })

    const req = await submitApprovalRequest({
      type: 'ORDER_QUANTITY_REDUCTION',
      providerId: 'prov1',
      orderId: 'order1',
      orderItemId: 'item1',
      data: { newQuantity: 1 },
      submittedBy: 'prov1',
    })

    expect(req).toMatchObject({ id: 'req1' })
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order1' }, data: { status: 'PENDING_MODIFICATION_APPROVAL' } })
    expect(createNotification).toHaveBeenCalledTimes(2)
  })

  it('applies approved quantity reduction and notifies provider and customer', async () => {
    ;(prisma.approvalRequest.findUnique as any).mockResolvedValue({ id: 'req1', type: 'ORDER_QUANTITY_REDUCTION', providerId: 'prov1', orderItemId: 'item1', orderId: 'order1', data: { newQuantity: 2 } })
    ;(prisma.providerProfile.findUnique as any).mockResolvedValue({ userId: 'provUser1' })
    ;(prisma.order.findUnique as any).mockResolvedValue({ customerId: 'cust1', orderNumber: 'ASH-100' })
    ;(prisma.orderItem.findUnique as any).mockResolvedValue({ id: 'item1', orderId: 'order1', quantity: 3, unitPrice: 100, totalPrice: 300 })
    ;(prisma.orderItem.update as any).mockResolvedValue({ id: 'item1', quantity: 2, totalPrice: 200 })
    ;(prisma.orderItem.findMany as any).mockResolvedValue([{ totalPrice: 200 }])
    ;(prisma.order.update as any).mockResolvedValue({ id: 'order1', totalAmount: 200 })
    ;(prisma.approvalRequest.update as any).mockResolvedValue({ id: 'req1' })
    ;(prisma.auditLog.create as any).mockResolvedValue({ id: 'log2' })
    ;(createNotification as any).mockResolvedValue({ id: 'note2' })

    const res = await applyApproval('req1', 'admin1', true, 'approved')

    expect(res).toEqual({ ok: true })
    expect(prisma.orderItem.update).toHaveBeenCalled()
    expect(prisma.order.update).toHaveBeenCalledWith({ where: { id: 'order1' }, data: { totalAmount: 200 } })
    expect(createNotification).toHaveBeenCalledTimes(2)
  })
})
