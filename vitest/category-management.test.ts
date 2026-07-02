import { describe, expect, it } from 'vitest'
import { buildCategorySlug, getCategoryDeletionOutcome } from '../src/lib/admin/category-management'

describe('category management helpers', () => {
  it('normalizes a slug from English and Arabic names', () => {
    expect(buildCategorySlug('Fresh Fruits', 'فواكه طازجة', '')).toBe('fresh-fruits')
    expect(buildCategorySlug('', 'أجهزة', '  ')).toBe('أجهزة')
  })

  it('blocks deletion when products still belong to the category unless forced', () => {
    expect(getCategoryDeletionOutcome({ productCount: 2, force: false })).toEqual({ ok: false, reason: 'category_has_products' })
    expect(getCategoryDeletionOutcome({ productCount: 2, force: true })).toEqual({ ok: true })
    expect(getCategoryDeletionOutcome({ productCount: 0, force: false })).toEqual({ ok: true })
  })
})
