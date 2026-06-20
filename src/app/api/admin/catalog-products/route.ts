import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { categoryId, nameEN, nameAR, descriptionEN, descriptionAR, minimumPrice, maximumPrice, wholesaleMinPrice, wholesaleMaxPrice, retailMinPrice, retailMaxPrice, images, unitRanges } = body
    if (!categoryId || !(nameEN || nameAR) || !minimumPrice || !maximumPrice) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const imgs = Array.isArray(images) ? images : (typeof images === 'string' ? images.split(',').map((s: string) => s.trim()).filter(Boolean) : [])

    const wMin = wholesaleMinPrice ?? minimumPrice
    const wMax = wholesaleMaxPrice ?? maximumPrice
    const rMin = retailMinPrice ?? 0
    const rMax = retailMaxPrice ?? 0

    const product = await prisma.catalogProduct.create({
      data: {
        categoryId,
        nameEN: nameEN || '',
        nameAR: nameAR || '',
        descriptionEN: descriptionEN || null,
        descriptionAR: descriptionAR || null,
        images: imgs,
        minimumPrice: Number(minimumPrice),
        maximumPrice: Number(maximumPrice),
        wholesaleMinPrice: Number(wMin),
        wholesaleMaxPrice: Number(wMax),
        retailMinPrice: Number(rMin),
        retailMaxPrice: Number(rMax),
      }
    })

    // if unitRanges provided, create entries
    if (Array.isArray(unitRanges) && unitRanges.length > 0) {
      const data = unitRanges.map((u: any) => ({
        catalogProductId: product.id,
        unitType: u.unitType,
        minPrice: Number(u.minPrice || 0),
        maxPrice: Number(u.maxPrice || 0),
      }))
      try {
        await prisma.catalogProductUnitRange.createMany({ data })
      } catch (err) {
        console.error('create unit ranges error', err)
      }
    }

    return NextResponse.json({ ok: true, id: product.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
