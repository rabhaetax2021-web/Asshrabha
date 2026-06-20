import { describe, it, expect } from 'vitest'
import { createProviderProductSchema, updateStoreSchema, createSuggestionSchema } from '../src/lib/validations/provider'
import { loginSchema, registerSchema, verifyOTPSchema } from '../src/lib/validations/auth'
import { categorySchema, catalogProductSchema } from '../src/lib/validations/catalog'

describe('Zod validations', () => {
  it('validates auth schemas', () => {
    expect(() => loginSchema.parse({ mobile: '800100', password: 'password' })).not.toThrow()
    expect(() => registerSchema.parse({ mobile: '800101', nameEN: 'Test', password: 'password', role: 'PROVIDER' })).not.toThrow()
    expect(() => verifyOTPSchema.parse({ userId: 'u1', code: '1234' })).not.toThrow()
  })

  it('validates provider schemas', () => {
    expect(() => createProviderProductSchema.parse({ providerId: 'p1', catalogProductId: 'c1', sellingPrice: 10 })).not.toThrow()
    expect(() => updateStoreSchema.parse({ providerId: 'p1', shopNameEN: 'Shop' })).not.toThrow()
    expect(() => createSuggestionSchema.parse({ providerId: 'p1', nameEN: 'Name', nameAR: 'اسم' })).not.toThrow()
  })

  it('validates catalog schemas', () => {
    expect(() => categorySchema.parse({ nameEN: 'Cat', nameAR: 'فئة' })).not.toThrow()
    expect(() => catalogProductSchema.parse({ categoryId: 'cat1', nameEN: 'T', nameAR: 'ت', minimumPrice: 1, maximumPrice: 5 })).not.toThrow()
  })
})
