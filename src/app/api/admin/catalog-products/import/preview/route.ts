import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsvToProducts, parseXlsxToProducts, findDuplicateImportProducts } from '@/lib/utils/excel-utils'
import { isAdmin } from '@/lib/utils/permissions'

function isAdminUser(current: Awaited<ReturnType<typeof getCurrentUser>>) {
  return !!current && isAdmin(current.role) && current.status === 'APPROVED'
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!isAdminUser(current)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'file must be CSV or XLSX format' }, { status: 400 })
    }

    const parseResult = file.name.endsWith('.xlsx')
      ? await parseXlsxToProducts(Buffer.from(await file.arrayBuffer()))
      : parseCsvToProducts(await file.text())

    const { success, errors } = parseResult

    if (errors.length > 0) {
      return NextResponse.json({ ok: false, errors: errors.slice(0, 20) }, { status: 400 })
    }

    if (success.length === 0) {
      return NextResponse.json({ ok: false, errors: [{ row: 0, error: 'No valid products found in file' }] }, { status: 400 })
    }

    const categoryIds = [...new Set(success.map((p) => p.categoryId))]
    const [categories, existingProducts] = await Promise.all([
      prisma.category.findMany({ where: { id: { in: categoryIds } }, select: { id: true, nameEN: true, nameAR: true } }),
      prisma.catalogProduct.findMany({ select: { nameEN: true, nameAR: true } }),
    ])

    const validCategoryIds = new Set(categories.map((c) => c.id))
    const invalidProducts = success.filter((p) => !validCategoryIds.has(p.categoryId))

    if (invalidProducts.length > 0) {
      return NextResponse.json({ ok: false, errors: [{ row: 0, error: `Invalid category IDs: ${[...new Set(invalidProducts.map((p) => p.categoryId))].join(', ')}` }] }, { status: 400 })
    }

    const duplicates = findDuplicateImportProducts(success, existingProducts)

    return NextResponse.json({
      ok: true,
      previewProducts: success.map((product) => ({
        ...product,
        images: [],
        categoryId: product.categoryId,
        nameEN: product.nameEN,
        nameAR: product.nameAR,
        descriptionEN: product.descriptionEN || '',
        descriptionAR: product.descriptionAR || '',
        wholesaleMinPrice: product.wholesaleMinPrice,
        wholesaleMaxPrice: product.wholesaleMaxPrice,
        retailMinPrice: product.retailMinPrice,
        retailMaxPrice: product.retailMaxPrice,
        unitType: product.unitType || 'PIECE',
        status: (product.status || 'ACTIVE').toUpperCase(),
      })),
      categories,
      duplicates,
      errors: [],
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
