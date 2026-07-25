import { describe, expect, it } from 'vitest'
import XLSX from 'xlsx'
import { parseXlsxToProducts } from '../src/lib/utils/excel-utils'

describe('catalog import template parsing', () => {
  it('parses workbook headers with extra whitespace and required values', async () => {
    const wsData = [
      ['PRODUCT IMPORT TEMPLATE'],
      [''],
      [' categoryId ', ' nameEN ', ' nameAR ', ' descriptionEN ', ' descriptionAR ', ' wholesaleMinPrice ', ' wholesaleMaxPrice ', ' retailMinPrice ', ' retailMaxPrice ', ' unitType ', ' status '],
      ['cat-1', 'Coffee', 'قهوة', 'Fresh roasted beans', 'حبوب قهوة محمصة', '10', '20', '15', '25', 'PIECE', 'ACTIVE']
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    const result = await parseXlsxToProducts(Buffer.from(buffer))

    expect(result.errors).toEqual([])
    expect(result.success).toHaveLength(1)
    expect(result.success[0]).toMatchObject({
      categoryId: 'cat-1',
      nameEN: 'Coffee',
      nameAR: 'قهوة',
      wholesaleMinPrice: 10,
      wholesaleMaxPrice: 20,
      retailMinPrice: 15,
      retailMaxPrice: 25,
      unitType: 'PIECE',
      status: 'ACTIVE',
    })
  })
})
