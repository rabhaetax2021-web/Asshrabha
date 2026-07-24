import { describe, expect, it } from 'vitest'
import { validateProviderPurchaseConditions } from '@/lib/purchase-conditions'

describe('validateProviderPurchaseConditions', () => {
  it('passes when order meets the minimums', () => {
    const result = validateProviderPurchaseConditions({ minOrderItems: 2, minOrderAmount: 100 }, [{ quantity: 2, price: 60 }], 'en')
    expect(result.ok).toBe(true)
  })

  it('fails when order does not meet the minimum amount', () => {
    const result = validateProviderPurchaseConditions({ minOrderItems: 1, minOrderAmount: 100 }, [{ quantity: 1, price: 20 }], 'en')
    expect(result.ok).toBe(false)
    expect(result.messageEN).toContain('required purchase conditions')
  })
})
