import { describe, it, expect } from 'vitest'
import { createProviderProductSchema, updateStoreSchema, createSuggestionSchema } from '../src/lib/validations/provider'
import { loginSchema, registerSchema, verifyOTPSchema } from '../src/lib/validations/auth'
import { categorySchema, catalogProductSchema } from '../src/lib/validations/catalog'
import { normalizeEgyptMobile, normalizeEgyptMobileToE164 } from '../src/lib/utils/helpers'

describe('Zod validations', () => {
  it('validates auth schemas', () => {
    expect(() => loginSchema.parse({ mobile: '800100', password: 'password' })).not.toThrow()
    expect(() => registerSchema.parse({ mobile: '800101', nameEN: 'Test', password: 'password', role: 'PROVIDER' })).not.toThrow()
    expect(() => verifyOTPSchema.parse({ userId: 'u1', code: '1234' })).not.toThrow()
  })

  it('normalizes Egyptian mobile formats', () => {
    expect(normalizeEgyptMobile('+201091201789')).toBe('01091201789')
    expect(normalizeEgyptMobile('201091201789')).toBe('01091201789')
    expect(normalizeEgyptMobile('1091201789')).toBe('01091201789')
    expect(normalizeEgyptMobile('01091201789')).toBe('01091201789')
    expect(normalizeEgyptMobileToE164('01091201789')).toBe('+201091201789')
    expect(normalizeEgyptMobileToE164('201091201789')).toBe('+201091201789')
    expect(normalizeEgyptMobileToE164('+201091201789')).toBe('+201091201789')
  })

  it('validates provider schemas', () => {
    expect(() => createProviderProductSchema.parse({ catalogProductId: 'c1', sellingPrice: 10, wholesalePrice: 0, retailPrice: 1 })).not.toThrow()
    expect(() => updateStoreSchema.parse({ providerId: 'p1', shopNameEN: 'Shop' })).not.toThrow()
    expect(() => createSuggestionSchema.parse({ nameEN: 'Name', nameAR: 'اسم' })).not.toThrow()
  })

  it('validates catalog schemas', () => {
    expect(() => categorySchema.parse({ nameEN: 'Cat', nameAR: 'فئة' })).not.toThrow()
    expect(() => catalogProductSchema.parse({
      categoryId: 'cat1',
      nameEN: 'T',
      nameAR: 'ت',
      wholesaleMinPrice: 8,
      wholesaleMaxPrice: 12,
      retailMinPrice: 13,
      retailMaxPrice: 18,
      unitType: 'PIECE',
    })).not.toThrow()
  })
})
