import { describe, expect, it } from 'vitest'
import { buildCheckoutTotals } from '@/lib/order-pricing'

describe('buildCheckoutTotals', () => {
  it('adds shipping to the item subtotal', () => {
    const totals = buildCheckoutTotals(
      [
        { quantity: 2, price: 25 },
        { quantity: 1, price: 10 },
      ],
      15,
    )

    expect(totals).toEqual({
      itemsSubtotal: 60,
      shipping: 15,
      totalAmount: 75,
    })
  })
})
