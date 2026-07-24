import { describe, expect, it } from 'vitest'
import { resolveProductPrice } from '@/lib/cart-price'

describe('resolveProductPrice', () => {
  it('prefers retailer price for retail buyers and falls back to selling price', () => {
    const price = resolveProductPrice({
      retailPrice: 50,
      wholesalePrice: 40,
      sellingPrice: 45,
    }, false)

    expect(price).toBe(50)
  })

  it('uses the option price when present', () => {
    const price = resolveProductPrice({
      retailPrice: 50,
      wholesalePrice: 40,
      sellingPrice: 45,
    }, false, 62)

    expect(price).toBe(62)
  })
})
