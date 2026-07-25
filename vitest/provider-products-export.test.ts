import { describe, expect, it } from 'vitest'
import * as XLSX from 'xlsx'
import { generateProviderProductsWorkbook } from '../src/lib/utils/excel-utils'

describe('provider products workbook export', () => {
  it('creates an Excel workbook with provider product rows', async () => {
    const buffer = await generateProviderProductsWorkbook([
      {
        id: 'product-1',
        nameEN: 'Organic Tea',
        nameAR: 'شاي عضوي',
        status: 'ACTIVE',
        wholesalePrice: 50,
        retailPrice: 120,
        sellingPrice: 90,
        stockQuantity: 25,
        catalogProduct: { nameEN: 'Organic Tea', nameAR: 'شاي عضوي' },
      },
    ])

    expect(Buffer.isBuffer(buffer)).toBe(true)

    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as Array<Array<string | number>>

    expect(rows[0][0]).toBe('Provider Products Export')
    expect(rows[2][0]).toBe('Product ID')
    expect(rows[3][0]).toBe('product-1')
    expect(rows[3][6]).toBe(90)
  })
})
