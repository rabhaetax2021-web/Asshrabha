// ponytail: CSV-based Excel import/export (no xlsx lib needed, Excel opens/saves CSV natively)

export interface ProductImportRow {
  categoryId: string
  nameEN: string
  nameAR: string
  descriptionEN?: string
  descriptionAR?: string
  wholesaleMinPrice: number
  wholesaleMaxPrice: number
  retailMinPrice: number
  retailMaxPrice: number
  unitType: string
  status?: string
  rowNumber?: number
}

export interface ImportDuplicateProduct {
  row: number
  nameEN: string
  nameAR: string
  reason: 'sheet' | 'db'
}

export interface ProviderProductExportRow {
  id: string
  nameEN?: string | null
  nameAR?: string | null
  status?: string | null
  wholesalePrice?: number | null
  retailPrice?: number | null
  sellingPrice?: number | null
  stockQuantity?: number | null
  createdAt?: Date | string | null
  catalogProduct?: {
    nameEN?: string | null
    nameAR?: string | null
  } | null
}

const CSV_HEADERS = [
  'categoryId',
  'nameEN',
  'nameAR',
  'descriptionEN',
  'descriptionAR',
  'wholesaleMinPrice',
  'wholesaleMaxPrice',
  'retailMinPrice',
  'retailMaxPrice',
  'unitType',
  'status'
]

export function generateCsvTemplate(categories: Array<{ id: string; nameEN?: string | null; nameAR?: string | null }>): string {
  const header = CSV_HEADERS.join(',')
  
  // Add category reference rows as comments
  const categoryLines = categories.map(c => `# ${c.id} | ${c.nameEN || c.nameAR || 'Unknown'}`)
  
  // Add multiple example rows with different products
  const examples = [
    [
      categories[0]?.id || 'cat-id',
      'Organic Tea',
      'شاي عضوي',
      'Premium quality loose leaf tea',
      'شاي متميز من أوراق الشاي الطبيعي',
      '50',
      '150',
      '100',
      '300',
      'PIECE',
      'ACTIVE'
    ],
    [
      categories[1]?.id || 'cat-id',
      'Coffee Beans',
      'حبات القهوة',
      'Medium roast arabica beans',
      'حبات قهوة عربية متوسطة التحميص',
      '100',
      '300',
      '200',
      '500',
      'KG',
      'ACTIVE'
    ],
    [
      categories[2]?.id || 'cat-id',
      'Fresh Orange Juice',
      'عصير برتقال طازج',
      'Freshly squeezed daily',
      'معصور طازج يومياً',
      '30',
      '80',
      '50',
      '120',
      'LITER',
      'ACTIVE'
    ]
  ].map(row => row.map(v => `"${v}"`).join(','))

  return [
    '# PRODUCT IMPORT TEMPLATE',
    '# Instructions: Fill in the cells below with your product data. Do NOT modify the header row.',
    '# Upload this file using the admin catalog import feature.',
    '#',
    '# ========== CATEGORIES REFERENCE ==========',
    ...categoryLines,
    '#',
    '# ========== COLUMN DESCRIPTIONS ==========',
    '# categoryId (Text/Required) - Use one of the category IDs listed above',
    '# nameEN (Text/Required) - Product name in English',
    '# nameAR (Text/Required) - Product name in Arabic',
    '# descriptionEN (Text/Optional) - Product description in English',
    '# descriptionAR (Text/Optional) - Product description in Arabic',
    '# wholesaleMinPrice (Number/Required) - Minimum wholesale price in EGP',
    '# wholesaleMaxPrice (Number/Required) - Maximum wholesale price in EGP',
    '# retailMinPrice (Number/Required) - Minimum retail price in EGP',
    '# retailMaxPrice (Number/Required) - Maximum retail price in EGP',
    '# unitType (Text/Required) - PIECE, KG, LITER, BOX, etc.',
    '# status (Text/Optional) - ACTIVE or ARCHIVED (default: ACTIVE)',
    '#',
    '# ========== RULES ==========',
    '# 1. Do NOT delete the header row (first data row)',
    '# 2. Prices must be numbers (no currency symbols)',
    '# 3. Wholesale prices must be: min < max',
    '# 4. Retail prices must be: min < max',
    '# 5. Do NOT add extra commas or quotes inside text',
    '# 6. Delete example rows before uploading (or keep them to add multiple products)',
    '#',
    '# ========== DATA START HERE ==========',
    header,
    ...examples
  ].join('\n')
}

export function parseCsvToProducts(csvText: string): { success: ProductImportRow[]; errors: Array<{ row: number; error: string }> } {
  const lines = csvText.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'))
  
  if (lines.length === 0) {
    return { success: [], errors: [{ row: 0, error: 'No data rows found' }] }
  }
  
  // Skip header row
  const dataLines = lines.slice(1)
  const success: ProductImportRow[] = []
  const errors: Array<{ row: number; error: string }> = []
  
  dataLines.forEach((line, idx) => {
    const rowNum = idx + 2 // +2 for 1-based indexing and header
    try {
      const values = parseCsvLine(line)
      
      if (values.length < 9) {
        errors.push({ row: rowNum, error: 'Missing required fields' })
        return
      }
      
      const [categoryId, nameEN, nameAR, descriptionEN, descriptionAR, wholesaleMinPrice, wholesaleMaxPrice, retailMinPrice, retailMaxPrice, unitType, status] = values
      
      if (!categoryId || !nameEN || !nameAR || !wholesaleMinPrice || !wholesaleMaxPrice || !retailMinPrice || !retailMaxPrice || !unitType) {
        errors.push({ row: rowNum, error: 'Missing required fields' })
        return
      }
      
      const wholesaleMin = Number(wholesaleMinPrice)
      const wholesaleMax = Number(wholesaleMaxPrice)
      const retailMin = Number(retailMinPrice)
      const retailMax = Number(retailMaxPrice)
      
      if (isNaN(wholesaleMin) || isNaN(wholesaleMax) || isNaN(retailMin) || isNaN(retailMax)) {
        errors.push({ row: rowNum, error: 'Invalid price values' })
        return
      }
      
      if (wholesaleMin > wholesaleMax) {
        errors.push({ row: rowNum, error: 'Wholesale min price must be <= max price' })
        return
      }
      
      if (retailMin > retailMax) {
        errors.push({ row: rowNum, error: 'Retail min price must be <= max price' })
        return
      }
      
      success.push({
        categoryId: categoryId.trim(),
        nameEN: nameEN.trim(),
        nameAR: nameAR.trim(),
        descriptionEN: descriptionEN?.trim(),
        descriptionAR: descriptionAR?.trim(),
        wholesaleMinPrice: wholesaleMin,
        wholesaleMaxPrice: wholesaleMax,
        retailMinPrice: retailMin,
        retailMaxPrice: retailMax,
        unitType: unitType.trim(),
        status: (status?.trim() || 'ACTIVE').toUpperCase(),
        rowNumber: rowNum
      })
    } catch (err) {
      errors.push({ row: rowNum, error: String(err) })
    }
  })
  
  return { success, errors }
}

// CSV line parser that handles quoted values with commas
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current)
  return result
}

function normalizeImportName(value?: string | null): string {
  return (value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
    .trim()
}

export function findDuplicateImportProducts(
  rows: Array<Pick<ProductImportRow, 'nameEN' | 'nameAR' | 'rowNumber'>>,
  existingProducts: Array<{ nameEN?: string | null; nameAR?: string | null }>
): ImportDuplicateProduct[] {
  const duplicates: ImportDuplicateProduct[] = []
  const seenNames = new Set<string>()

  const addDuplicate = (row: Pick<ProductImportRow, 'nameEN' | 'nameAR' | 'rowNumber'>, reason: 'sheet' | 'db') => {
    if (!row.nameEN && !row.nameAR) return
    duplicates.push({
      row: row.rowNumber ?? 0,
      nameEN: row.nameEN || '',
      nameAR: row.nameAR || '',
      reason,
    })
  }

  rows.forEach((row) => {
    const normalizedRowNames = [normalizeImportName(row.nameEN), normalizeImportName(row.nameAR)].filter(Boolean)

    if (normalizedRowNames.some((name) => seenNames.has(name))) {
      addDuplicate(row, 'sheet')
    }

    normalizedRowNames.forEach((name) => seenNames.add(name))

    const isDuplicateInDb = existingProducts.some((product) => {
      const existingNames = [normalizeImportName(product.nameEN), normalizeImportName(product.nameAR)].filter(Boolean)
      return existingNames.some((name) => normalizedRowNames.includes(name))
    })

    if (isDuplicateInDb) {
      addDuplicate(row, 'db')
    }
  })

  return duplicates
}

// XLSX-based template with better visual formatting
export async function generateXlsxTemplate(categories: Array<{ id: string; nameEN?: string | null; nameAR?: string | null }>): Promise<Buffer> {
  const XLSX = await import('xlsx')
  
  // Create data structure for Excel
  const wsData: any[] = []
  let rowNum = 0

  // Title
  wsData[rowNum] = ['PRODUCT IMPORT TEMPLATE - Admin Catalog']
  rowNum++
  
  wsData[rowNum] = ['']
  rowNum++

  // Instructions
  wsData[rowNum] = ['Instructions: Fill in the cells below with your product data. Do NOT modify the header row.']
  rowNum++
  wsData[rowNum] = ['Upload this file using the admin catalog import feature.']
  rowNum++
  
  wsData[rowNum] = ['']
  rowNum++

  // Categories Reference
  wsData[rowNum] = ['CATEGORIES REFERENCE - Copy the ID to use in your products']
  rowNum++
  wsData[rowNum] = ['Category ID', 'Category Name']
  rowNum++
  
  categories.forEach(cat => {
    wsData[rowNum] = [cat.id, cat.nameEN || cat.nameAR || 'Unknown']
    rowNum++
  })
  
  wsData[rowNum] = ['']
  rowNum++

  // Column Descriptions
  wsData[rowNum] = ['COLUMN DESCRIPTIONS & DATA TYPES']
  rowNum++
  wsData[rowNum] = ['Column Name', 'Data Type', 'Required', 'Description']
  rowNum++
  
  const columnInfo = [
    ['categoryId', 'Text', 'YES', 'Use one of the category IDs from the reference section above'],
    ['nameEN', 'Text', 'YES', 'Product name in English'],
    ['nameAR', 'Text', 'YES', 'Product name in Arabic'],
    ['descriptionEN', 'Text', 'NO', 'Product description in English'],
    ['descriptionAR', 'Text', 'NO', 'Product description in Arabic'],
    ['wholesaleMinPrice', 'Number', 'YES', 'Minimum wholesale price in EGP'],
    ['wholesaleMaxPrice', 'Number', 'YES', 'Maximum wholesale price in EGP (must be >= min)'],
    ['retailMinPrice', 'Number', 'YES', 'Minimum retail price in EGP'],
    ['retailMaxPrice', 'Number', 'YES', 'Maximum retail price in EGP (must be >= min)'],
    ['unitType', 'Text', 'YES', 'PIECE, KG, LITER, BOX, PACK, etc.'],
    ['status', 'Text', 'NO', 'ACTIVE or ARCHIVED (default: ACTIVE)']
  ]
  
  columnInfo.forEach(info => {
    wsData[rowNum] = info
    rowNum++
  })
  
  wsData[rowNum] = ['']
  rowNum++

  // Rules
  wsData[rowNum] = ['IMPORTANT RULES']
  rowNum++
  wsData[rowNum] = ['Rule', 'Description']
  rowNum++
  
  const rules = [
    ['Do NOT delete the header row', 'The first row with all column names must remain'],
    ['Prices must be numbers only', 'No currency symbols or letters (e.g., 100 not 100 EGP)'],
    ['Wholesale min < max', 'wholesaleMinPrice must be less than wholesaleMaxPrice'],
    ['Retail min < max', 'retailMinPrice must be less than retailMaxPrice'],
    ['No extra spaces', 'Text values should not have leading/trailing spaces'],
    ['Category ID must be valid', 'Use exact IDs from the categories reference section'],
    ['Delete example rows before upload', 'Remove the example products before submitting (or keep them to add multiple)']
  ]
  
  rules.forEach(rule => {
    wsData[rowNum] = rule
    rowNum++
  })
  
  wsData[rowNum] = ['']
  rowNum++

  // Data Entry Section Header
  wsData[rowNum] = ['ENTER YOUR PRODUCTS BELOW - Start from the next row']
  rowNum++
  
  const headerRow = rowNum
  wsData[rowNum] = CSV_HEADERS
  rowNum++

  // Example rows
  const examples = [
    [categories[0]?.id || 'cat-id', 'Organic Tea', 'شاي عضوي', 'Premium quality loose leaf tea', 'شاي متميز من أوراق الشاي الطبيعي', 50, 150, 100, 300, 'PIECE', 'ACTIVE'],
    [categories[1]?.id || 'cat-id', 'Coffee Beans', 'حبات القهوة', 'Medium roast arabica beans', 'حبات قهوة عربية متوسطة التحميص', 100, 300, 200, 500, 'KG', 'ACTIVE'],
    [categories[2]?.id || 'cat-id', 'Fresh Orange Juice', 'عصير برتقال طازج', 'Freshly squeezed daily', 'معصور طازج يومياً', 30, 80, 50, 120, 'LITER', 'ACTIVE']
  ]
  
  examples.forEach(example => {
    wsData[rowNum] = example
    rowNum++
  })

  // Create workbook and worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 18 }, // categoryId
    { wch: 25 }, // nameEN
    { wch: 25 }, // nameAR
    { wch: 30 }, // descriptionEN
    { wch: 30 }, // descriptionAR
    { wch: 18 }, // wholesaleMinPrice
    { wch: 18 }, // wholesaleMaxPrice
    { wch: 18 }, // retailMinPrice
    { wch: 18 }, // retailMaxPrice
    { wch: 15 }, // unitType
    { wch: 12 }  // status
  ]

  // Add cell styling
  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, size: 12 },
    fill: { fgColor: { rgb: '1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
  }

  const titleStyle = {
    font: { bold: true, size: 14, color: { rgb: '1F4E78' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  }

  // Apply styles to header row
  for (let col = 0; col < CSV_HEADERS.length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRow, c: col })
    if (!ws[cellRef]) ws[cellRef] = {}
    ws[cellRef].s = headerStyle
  }

  // Apply title style
  ws['A1'].s = titleStyle

  // Freeze panes at data section
  ws['!freeze'] = { xSplit: 0, ySplit: headerRow + 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Products')

  // Generate buffer
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return buf as Buffer
}

export async function generateProviderProductsWorkbook(products: ProviderProductExportRow[]): Promise<Buffer> {
  const XLSX = await import('xlsx')

  const wsData: any[][] = [
    ['Provider Products Export'],
    ['Generated from your provider listings'],
    ['Product ID', 'Product Name (EN)', 'Product Name (AR)', 'Status', 'Wholesale Price', 'Retail Price', 'Selling Price', 'Stock Quantity', 'Created At'],
    ...products.map((product) => [
      product.id,
      product.catalogProduct?.nameEN || product.nameEN || '',
      product.catalogProduct?.nameAR || product.nameAR || '',
      product.status || '',
      product.wholesalePrice ?? '',
      product.retailPrice ?? '',
      product.sellingPrice ?? '',
      product.stockQuantity ?? '',
      product.createdAt ? new Date(product.createdAt).toLocaleString() : '',
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  ws['!cols'] = [
    { wch: 24 },
    { wch: 28 },
    { wch: 28 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 24 },
  ]

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, size: 11 },
    fill: { fgColor: { rgb: '1F4E78' } },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  }

  const titleStyle = {
    font: { bold: true, size: 14, color: { rgb: '1F4E78' } },
    alignment: { horizontal: 'left', vertical: 'center' },
  }

  ws['A1'].s = titleStyle
  for (let col = 0; col < 9; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: col })
    ws[cellRef] = ws[cellRef] || {}
    ws[cellRef].s = headerStyle
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Provider Products')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })
  return buf as Buffer
}

// Parse XLSX file to products
export async function parseXlsxToProducts(buffer: Buffer): Promise<{ success: ProductImportRow[]; errors: Array<{ row: number; error: string }> }> {
  const XLSX = await import('xlsx')
  
  try {
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    
    if (!ws) {
      return { success: [], errors: [{ row: 0, error: 'No sheet found in Excel file' }] }
    }

    // Convert to array of arrays, starting from row with headers
    const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][]
    
    if (data.length === 0) {
      return { success: [], errors: [{ row: 0, error: 'No data found in Excel file' }] }
    }

    // Find header row - it should have all the column names
    let headerRowIndex = 0
    for (let i = 0; i < Math.min(100, data.length); i++) {
      const row = data[i]
      if (Array.isArray(row) && row.includes('categoryId')) {
        headerRowIndex = i
        break
      }
    }

    const headerRow = data[headerRowIndex]
    if (!headerRow) {
      return { success: [], errors: [{ row: 0, error: 'Header row not found' }] }
    }

    // Map column indices
    const columnMap: { [key: string]: number } = {}
    CSV_HEADERS.forEach((header, idx) => {
      const colIdx = headerRow.indexOf(header)
      if (colIdx !== -1) {
        columnMap[header] = colIdx
      }
    })

    const success: ProductImportRow[] = []
    const errors: Array<{ row: number; error: string }> = []

    // Parse data rows
    const dataRows = data.slice(headerRowIndex + 1)
    dataRows.forEach((row, idx) => {
      const rowNum = headerRowIndex + idx + 2 // +2 for 0-based to 1-based and header row
      
      if (!Array.isArray(row) || row.every(v => v === undefined || v === null || v === '')) {
        return // Skip empty rows
      }

      try {
        const categoryId = row[columnMap['categoryId']]
        const nameEN = row[columnMap['nameEN']]
        const nameAR = row[columnMap['nameAR']]
        const descriptionEN = row[columnMap['descriptionEN']]
        const descriptionAR = row[columnMap['descriptionAR']]
        const wholesaleMinPrice = row[columnMap['wholesaleMinPrice']]
        const wholesaleMaxPrice = row[columnMap['wholesaleMaxPrice']]
        const retailMinPrice = row[columnMap['retailMinPrice']]
        const retailMaxPrice = row[columnMap['retailMaxPrice']]
        const unitType = row[columnMap['unitType']]
        const status = row[columnMap['status']]

        if (!categoryId || !nameEN || !nameAR || wholesaleMinPrice === undefined || wholesaleMaxPrice === undefined || retailMinPrice === undefined || retailMaxPrice === undefined || !unitType) {
          errors.push({ row: rowNum, error: 'Missing required fields' })
          return
        }

        const wholesaleMin = Number(wholesaleMinPrice)
        const wholesaleMax = Number(wholesaleMaxPrice)
        const retailMin = Number(retailMinPrice)
        const retailMax = Number(retailMaxPrice)

        if (isNaN(wholesaleMin) || isNaN(wholesaleMax) || isNaN(retailMin) || isNaN(retailMax)) {
          errors.push({ row: rowNum, error: 'Invalid price values' })
          return
        }

        if (wholesaleMin > wholesaleMax) {
          errors.push({ row: rowNum, error: 'Wholesale min price must be <= max price' })
          return
        }

        if (retailMin > retailMax) {
          errors.push({ row: rowNum, error: 'Retail min price must be <= max price' })
          return
        }

        success.push({
          categoryId: String(categoryId).trim(),
          nameEN: String(nameEN).trim(),
          nameAR: String(nameAR).trim(),
          descriptionEN: descriptionEN ? String(descriptionEN).trim() : undefined,
          descriptionAR: descriptionAR ? String(descriptionAR).trim() : undefined,
          wholesaleMinPrice: wholesaleMin,
          wholesaleMaxPrice: wholesaleMax,
          retailMinPrice: retailMin,
          retailMaxPrice: retailMax,
          unitType: String(unitType).trim(),
          status: (status ? String(status).trim() : 'ACTIVE').toUpperCase(),
          rowNumber: rowNum
        })
      } catch (err) {
        errors.push({ row: rowNum, error: String(err) })
      }
    })

    return { success, errors }
  } catch (err) {
    return { success: [], errors: [{ row: 0, error: `Excel parsing error: ${String(err)}` }] }
  }
}
