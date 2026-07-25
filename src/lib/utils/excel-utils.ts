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
  const categoryLines = categories.map(c => `# ${c.id} - ${c.nameEN || c.nameAR || 'Unknown'}`)
  
  // Add one example row
  const exampleRow = [
    categories[0]?.id || 'cat-id',
    'Product Name EN',
    'اسم المنتج بالعربية',
    'English description',
    'الوصف بالعربية',
    '10',
    '50',
    '20',
    '100',
    'PIECE',
    'ACTIVE'
  ].map(v => `"${v}"`).join(',')
  
  return [
    '# Download this template, fill in your product data, and upload it',
    '# Categories available:',
    ...categoryLines,
    '#',
    '# Required fields: categoryId, nameEN, nameAR, wholesaleMinPrice, wholesaleMaxPrice, retailMinPrice, retailMaxPrice, unitType',
    '# Optional fields: descriptionEN, descriptionAR, status (default: ACTIVE)',
    '#',
    header,
    exampleRow
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
        status: (status?.trim() || 'ACTIVE').toUpperCase()
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
