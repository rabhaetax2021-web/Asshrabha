import { beforeEach, describe, expect, it, vi } from 'vitest'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    orderItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    providerProduct: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }))

import { applyProviderOrderModification } from '../src/lib/provider/order-management'

describe('provider order management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reduces quantity and preserves the item history while updating the order total', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 'order-1', totalAmount: 120, providerId: 'provider-1' })
    prismaMock.orderItem.findUnique.mockResolvedValue({ id: 'item-1', orderId: 'order-1', quantity: 3, unitPrice: 40, totalPrice: 120, providerProductId: 'pp-1' })
    prismaMock.orderItem.findMany.mockResolvedValue([{ id: 'item-1', totalPrice: 80 }])
    prismaMock.providerProduct.findUnique.mockResolvedValue({ id: 'pp-1', providerId: 'provider-1' })
    prismaMock.providerProduct.update.mockResolvedValue({ id: 'pp-1', providerId: 'provider-1', status: 'REQUIRES_RE_REGISTRATION' })
    prismaMock.orderItem.update.mockResolvedValue({ id: 'item-1', quantity: 2, totalPrice: 80, unitPrice: 40 })
    prismaMock.order.update.mockResolvedValue({ id: 'order-1', totalAmount: 80 })
    prismaMock.auditLog.create.mockResolvedValue({})

    const result = await applyProviderOrderModification({
      providerId: 'provider-1',
      orderId: 'order-1',
      orderItemId: 'item-1',
      action: 'REDUCE_QUANTITY',
      userId: 'provider-user-1',
      newQuantity: 2,
    })

    expect(result.ok).toBe(true)
    expect(prismaMock.orderItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: expect.objectContaining({ quantity: 2, totalPrice: 80 }),
    }))
    expect(prismaMock.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'order-1' },
      data: expect.objectContaining({ totalAmount: 80 }),
    }))
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'provider-user-1',
        action: 'PROVIDER_ORDER_QUANTITY_CHANGED',
        details: expect.objectContaining({ previousQuantity: 3, newQuantity: 2 }),
      }),
    }))
  })

  it('removes a product without deleting the historical order item record', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 'order-1', totalAmount: 120, providerId: 'provider-1' })
    prismaMock.orderItem.findUnique.mockResolvedValue({ id: 'item-1', orderId: 'order-1', quantity: 2, unitPrice: 40, totalPrice: 80, providerProductId: 'pp-1' })
    prismaMock.orderItem.findMany.mockResolvedValue([{ id: 'item-1', totalPrice: 0 }])
    prismaMock.providerProduct.findUnique.mockResolvedValue({ id: 'pp-1', providerId: 'provider-1' })
    prismaMock.providerProduct.update.mockResolvedValue({ id: 'pp-1', providerId: 'provider-1', status: 'REQUIRES_RE_REGISTRATION' })
    prismaMock.orderItem.update.mockResolvedValue({ id: 'item-1', quantity: 0, totalPrice: 0, unitPrice: 40 })
    prismaMock.order.update.mockResolvedValue({ id: 'order-1', totalAmount: 0 })
    prismaMock.auditLog.create.mockResolvedValue({})

    const result = await applyProviderOrderModification({
      providerId: 'provider-1',
      orderId: 'order-1',
      orderItemId: 'item-1',
      action: 'REMOVE_PRODUCT',
      userId: 'provider-user-1',
    })

    expect(result.ok).toBe(true)
    expect(prismaMock.orderItem.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'item-1' },
      data: expect.objectContaining({ quantity: 0, totalPrice: 0 }),
    }))
    expect(prismaMock.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'provider-user-1',
        action: 'PROVIDER_ORDER_PRODUCT_REMOVED',
        details: expect.objectContaining({ removedProducts: expect.any(Array) }),
      }),
    }))
  })
})
