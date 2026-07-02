import { describe, expect, it } from 'vitest'
import { catalogProductUpdateSchema } from '../src/lib/validations/catalog'

describe('catalog product validation', () => {
  it('accepts partial updates that include a status', () => {
    const parsed = catalogProductUpdateSchema.safeParse({
      nameEN: 'Fresh Apples',
      descriptionEN: 'Crisp apples',
      status: 'ACTIVE',
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toMatchObject({
        nameEN: 'Fresh Apples',
        descriptionEN: 'Crisp apples',
        status: 'ACTIVE',
      })
    }
  })
})
