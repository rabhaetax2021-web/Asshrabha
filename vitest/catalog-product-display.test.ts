import { describe, expect, it } from 'vitest'
import { getCatalogProductTitle, getCatalogProductAlternateName, getCatalogProductDescription } from '@/lib/i18n/catalog-product-display'

describe('catalog product display helpers', () => {
  const product = {
    nameEN: 'Orange Juice',
    nameAR: 'عصير برتقال',
    descriptionEN: 'Fresh squeezed orange juice',
    descriptionAR: 'عصير برتقال طازج',
  }

  it('returns the Arabic title when the locale is ar', () => {
    expect(getCatalogProductTitle(product, 'ar')).toBe('عصير برتقال')
  })

  it('returns the English title when the locale is en', () => {
    expect(getCatalogProductTitle(product, 'en')).toBe('Orange Juice')
  })

  it('falls back to English when Arabic title is missing for ar locale', () => {
    expect(getCatalogProductTitle({ nameEN: 'Orange Juice' }, 'ar')).toBe('Orange Juice')
  })

  it('falls back to Arabic when English title is missing for en locale', () => {
    expect(getCatalogProductTitle({ nameAR: 'عصير برتقال' }, 'en')).toBe('عصير برتقال')
  })

  it('returns the alternate name when both names are different', () => {
    expect(getCatalogProductAlternateName(product, 'ar')).toBe('Orange Juice')
    expect(getCatalogProductAlternateName(product, 'en')).toBe('عصير برتقال')
  })

  it('returns an empty alternate name when only one name is present', () => {
    expect(getCatalogProductAlternateName({ nameEN: 'Orange Juice' }, 'en')).toBe('')
  })

  it('returns the Arabic description for ar locale', () => {
    expect(getCatalogProductDescription(product, 'ar')).toBe('عصير برتقال طازج')
  })

  it('returns the English description for en locale', () => {
    expect(getCatalogProductDescription(product, 'en')).toBe('Fresh squeezed orange juice')
  })

  it('falls back to English description when Arabic version is missing', () => {
    expect(getCatalogProductDescription({ descriptionEN: 'Fresh squeezed orange juice' }, 'ar')).toBe('Fresh squeezed orange juice')
  })
})
