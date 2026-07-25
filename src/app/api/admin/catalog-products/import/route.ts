import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsvToProducts } from '@/lib/utils/excel-utils'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || current.role !== 'ADMIN') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'file required' }, { status: 400 })
    }

    if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      return NextResponse.json({ error: 'file must be CSV or XLSX format' }, { status: 400 })
    }

    const text = await file.text()
    const { success, errors } = parseCsvToProducts(text)

    if (errors.length > 0) {
      return NextResponse.json({
        ok: false,
        imported: 0,
        errors: errors.slice(0, 20) // Limit to 20 errors to avoid huge responses
      }, { status: 400 })
    }

    if (success.length === 0) {
      return NextResponse.json({
        ok: false,
        imported: 0,
        errors: [{ row: 0, error: 'No valid products found in file' }]
      }, { status: 400 })
    }

    // Verify all categories exist
    const categoryIds = [...new Set(success.map(p => p.categoryId))]
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    })

    const validCategoryIds = new Set(categories.map(c => c.id))
    const invalidProducts = success.filter(p => !validCategoryIds.has(p.categoryId))

    if (invalidProducts.length > 0) {
      return NextResponse.json({
        ok: false,
        imported: 0,
        errors: [{ row: 0, error: `Invalid category IDs: ${[...new Set(invalidProducts.map(p => p.categoryId))].join(', ')}` }]
      }, { status: 400 })
    }

    // Create products
    const created = await Promise.all(
      success.map(product =>
        prisma.catalogProduct.create({
          data: {
            categoryId: product.categoryId,
            nameEN: product.nameEN,
            nameAR: product.nameAR,
            descriptionEN: product.descriptionEN,
            descriptionAR: product.descriptionAR,
            wholesaleMinPrice: product.wholesaleMinPrice,
            wholesaleMaxPrice: product.wholesaleMaxPrice,
            retailMinPrice: product.retailMinPrice,
            retailMaxPrice: product.retailMaxPrice,
            unitType: product.unitType as any,
            status: product.status as any || 'ACTIVE'
          }
        })
      )
    )

    return NextResponse.json({
      ok: true,
      imported: created.length,
      errors: []
    })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
