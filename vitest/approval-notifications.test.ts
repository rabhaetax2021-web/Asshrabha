import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createNotification } = vi.hoisted(() => ({
  createNotification: vi.fn(),
}))

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    approvalRequest: {
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    order: {
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../src/lib/actions/notification.actions', () => ({
  createNotification,
}))

import { prisma } from '../src/lib/prisma'
import { submitApprovalRequest } from '../src/lib/actions/approval.actions'

describe('order modification notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes the provider note in admin and customer notifications', async () => {
    ;(prisma.approvalRequest.create as any).mockResolvedValue({ id: 'req-1' })
    ;(prisma.auditLog.create as any).mockResolvedValue({})
    ;(prisma.order.update as any).mockResolvedValue({})
    ;(prisma.order.findUnique as any).mockResolvedValue({ customerId: 'customer-1', orderNumber: '1001' })
    ;(prisma.user.findMany as any).mockResolvedValue([{ id: 'admin-1' }])
    createNotification.mockResolvedValue({})

    await submitApprovalRequest({
      type: 'ORDER_QUANTITY_REDUCTION',
      providerId: 'provider-1',
      orderId: 'order-1',
      orderItemId: 'item-1',
      reason: 'Stock is low for this item',
      data: { previousQuantity: 3, newQuantity: 2 },
      submittedBy: 'provider-user-1',
    })

    const adminNotification = createNotification.mock.calls.find(([userId]) => userId === 'admin-1')
    const customerNotification = createNotification.mock.calls.find(([userId]) => userId === 'customer-1')

    expect(adminNotification?.[4]?.bodyEN).toContain('Stock is low for this item')
    expect(customerNotification?.[4]?.bodyEN).toContain('Stock is low for this item')
    expect(adminNotification?.[4]?.bodyAR).toContain('Stock is low for this item')
  })
})
