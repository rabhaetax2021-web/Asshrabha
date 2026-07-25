import { describe, expect, it } from 'vitest'
import { findDuplicateImportProducts } from '../src/lib/utils/excel-utils'

describe('catalog import duplicate detection', () => {
  it('flags products that duplicate existing catalog data or earlier rows in the import', () => {
    const rows = [
      {
        categoryId: 'cat-1',
        nameEN: 'Orange Juice',
        nameAR: 'عصير برتقال',
        descriptionEN: 'Fresh',
        descriptionAR: 'طازج',
        wholesaleMinPrice: 10,
        wholesaleMaxPrice: 20,
        retailMinPrice: 15,
        retailMaxPrice: 25,
        unitType: 'LITER',
        status: 'ACTIVE',
        rowNumber: 2,
      },
      {
        categoryId: 'cat-1',
        nameEN: 'Orange Juice',
        nameAR: 'عصير برتقال',
        descriptionEN: 'Duplicate row',
        descriptionAR: 'صفوف مكررة',
        wholesaleMinPrice: 12,
        wholesaleMaxPrice: 22,
        retailMinPrice: 18,
        retailMaxPrice: 28,
        unitType: 'LITER',
        status: 'ACTIVE',
        rowNumber: 3,
      },
      {
        categoryId: 'cat-2',
        nameEN: 'Mint Tea',
        nameAR: 'شاي نعناع',
        descriptionEN: 'Herbal',
        descriptionAR: 'اعشاب',
        wholesaleMinPrice: 8,
        wholesaleMaxPrice: 16,
        retailMinPrice: 12,
        retailMaxPrice: 22,
        unitType: 'PIECE',
        status: 'ACTIVE',
        rowNumber: 4,
      },
    ]

    const existingProducts = [
      { id: 'existing-1', nameEN: 'Mint Tea', nameAR: 'شاي نعناع' },
    ]

    const duplicates = findDuplicateImportProducts(rows, existingProducts)

    expect(duplicates).toHaveLength(2)
    expect(duplicates[0]).toMatchObject({ row: 3, nameEN: 'Orange Juice', nameAR: 'عصير برتقال', reason: 'sheet' })
    expect(duplicates[1]).toMatchObject({ row: 4, nameEN: 'Mint Tea', nameAR: 'شاي نعناع', reason: 'db' })
  })
})
