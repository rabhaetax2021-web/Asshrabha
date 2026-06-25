import { NextRequest, NextResponse } from 'next/server'
import { createProviderProduct } from '@/lib/actions/provider.actions'
import { createProviderProductSchema } from '@/lib/validations/provider'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown> = {}
    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      body = await request.json() as Record<string, unknown>
    } else {
      const fd = await request.formData()
      fd.forEach((v, k) => {
        body[k] = typeof v === 'string' ? v : v
      })
    }

    if (body.sellingPrice !== undefined) body.sellingPrice = Number(body.sellingPrice)
    if (body.wholesalePrice !== undefined) body.wholesalePrice = Number(body.wholesalePrice)
    if (body.retailPrice !== undefined) body.retailPrice = Number(body.retailPrice)
    if (body.stockQuantity !== undefined) body.stockQuantity = Number(body.stockQuantity)
    const parsed = createProviderProductSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { catalogProductId, sellingPrice, wholesalePrice, retailPrice, stockQuantity, options, wholesaleUnit } = parsed.data

    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER' || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const catalog = await prisma.catalogProduct.findUnique({
      where: { id: catalogProductId },
      select: {
        id: true,
        wholesaleMinPrice: true,
        wholesaleMaxPrice: true,
        retailMinPrice: true,
        retailMaxPrice: true,
        unitRanges: true,
      },
    })
    if (!catalog) return NextResponse.json({ error: 'catalog product not found' }, { status: 400 })

    if (catalog.wholesaleMaxPrice > 0 && (wholesalePrice < catalog.wholesaleMinPrice || wholesalePrice > catalog.wholesaleMaxPrice)) {
      return NextResponse.json({ error: `Wholesale price must be between ${catalog.wholesaleMinPrice} and ${catalog.wholesaleMaxPrice}` }, { status: 400 })
    }
    if (catalog.retailMaxPrice > 0 && (retailPrice < catalog.retailMinPrice || retailPrice > catalog.retailMaxPrice)) {
      return NextResponse.json({ error: `Retail price must be between ${catalog.retailMinPrice} and ${catalog.retailMaxPrice}` }, { status: 400 })
    }
    if (catalog.unitRanges && catalog.unitRanges.length > 0 && (!options || options.length === 0)) {
      return NextResponse.json({ error: 'This catalog product requires options and cannot be listed without them.' }, { status: 400 })
    }

    const result = await createProviderProduct(provider.id, catalogProductId, sellingPrice, Number(stockQuantity || 0), wholesalePrice, retailPrice, options || [], wholesaleUnit as string | undefined)
    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
