import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseCsvToProducts, parseXlsxToProducts } from '@/lib/utils/excel-utils'
import { isAdmin } from '@/lib/utils/permissions'
import { catalogProductSchema } from '@/lib/validations/catalog'
import { z } from 'zod'

function isAdminUser(current: Awaited<ReturnType<typeof getCurrentUser>>) {
  return !!current && isAdmin(current.role) && current.status === 'APPROVED'
}

const importProductsSchema = z.object({
  products: z.array(catalogProductSchema).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!isAdminUser(current)) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let success: Array<any> = []

    if (contentType.includes('application/json')) {
      const body = await request.json()
      const parsed = importProductsSchema.safeParse(body)
      if (!parsed.success) {
        const errorMessages = parsed.error.issues.map((issue) => {
          const path = issue.path.length ? issue.path.join('.') : 'products'
          return `${path}: ${issue.message}`
        })

        return NextResponse.json({ ok: false, imported: 0, errors: [{ row: 0, error: errorMessages.join('; ') }] }, { status: 400 })
      }

      success = parsed.data.products
    } else {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'file required' }, { status: 400 })
      }

      if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
        return NextResponse.json({ error: 'file must be CSV or XLSX format' }, { status: 400 })
      }

      let parseResult

      if (file.name.endsWith('.xlsx')) {
        const buffer = Buffer.from(await file.arrayBuffer())
        parseResult = await parseXlsxToProducts(buffer)
      } else {
        const text = await file.text()
        parseResult = parseCsvToProducts(text)
      }

      const parsed = parseResult
      if (parsed.errors.length > 0) {
        return NextResponse.json({ ok: false, imported: 0, errors: parsed.errors.slice(0, 20) }, { status: 400 })
      }

      success = parsed.success
    }

    if (success.length === 0) {
      return NextResponse.json({ ok: false, imported: 0, errors: [{ row: 0, error: 'No valid products found in file' }] }, { status: 400 })
    }

    const categoryIds = [...new Set(success.map((p: any) => p.categoryId))]
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true }
    })

    const validCategoryIds = new Set(categories.map((c) => c.id))
    const invalidProducts = success.filter((p: any) => !validCategoryIds.has(p.categoryId))

    if (invalidProducts.length > 0) {
      return NextResponse.json({ ok: false, imported: 0, errors: [{ row: 0, error: `Invalid category IDs: ${[...new Set(invalidProducts.map((p: any) => p.categoryId))].join(', ')}` }] }, { status: 400 })
    }

    const created = await Promise.all(
      success.map((product: any) =>
        prisma.catalogProduct.create({
          data: {
            categoryId: product.categoryId,
            nameEN: product.nameEN,
            nameAR: product.nameAR,
            descriptionEN: product.descriptionEN || null,
            descriptionAR: product.descriptionAR || null,
            wholesaleMinPrice: Number(product.wholesaleMinPrice),
            wholesaleMaxPrice: Number(product.wholesaleMaxPrice),
            retailMinPrice: Number(product.retailMinPrice),
            retailMaxPrice: Number(product.retailMaxPrice),
            images: Array.isArray(product.images) ? product.images : [],
            unitType: product.unitType,
            status: (product.status || 'ACTIVE').toUpperCase(),
          }
        })
      )
    )

    return NextResponse.json({ ok: true, imported: created.length, errors: [] })
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
