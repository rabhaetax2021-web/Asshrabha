import { describe, expect, it } from 'vitest'
import { calculateOrderTotals } from '../src/lib/order-pricing'

describe('calculateOrderTotals', () => {
  it('adds shipping price to the item total when recalculating an order total', async () => {
    const prismaLike = {
      orderItem: {
        findMany: async () => [{ totalPrice: 100 }, { totalPrice: 75 }],
      },
      order: {
        findUnique: async () => ({ addressId: 'address_1' }),
        update: async () => ({ id: 'order_1' }),
      },
      address: {
        findUnique: async () => ({ locationId: 'location_1' }),
      },
      deliveryZone: {
        findFirst: async () => ({ shippingPrice: 25 }),
      },
    }

    const result = await calculateOrderTotals(prismaLike as any, 'order_1', 'provider_1')

    expect(result.itemsTotal).toBe(175)
    expect(result.shippingPrice).toBe(25)
    expect(result.totalAmount).toBe(200)
  })
})
