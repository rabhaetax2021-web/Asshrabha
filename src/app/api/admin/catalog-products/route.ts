import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { getErrorMessage } from '@/lib/errors'
import { catalogProductSchema } from '@/lib/validations/catalog'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json() as Record<string, unknown>
    const parsed = catalogProductSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message || 'invalid payload' }, { status: 400 })
    }

    const {
      categoryId,
      nameEN,
      nameAR,
      descriptionEN,
      descriptionAR,
      wholesaleMinPrice,
      wholesaleMaxPrice,
      retailMinPrice,
      retailMaxPrice,
      unitType,
      images,
    } = parsed.data

    const imgs = Array.isArray(images)
      ? (images as string[])
      : typeof images === 'string'
      ? images.split(',').map((s) => s.trim()).filter(Boolean)
      : []

    // note: minimumPrice/maximumPrice removed from schema; use wholesale/retail ranges directly

    const product = await prisma.catalogProduct.create({
      data: {
        categoryId: String(categoryId),
        nameEN: String(nameEN || ''),
        nameAR: String(nameAR || ''),
        descriptionEN: descriptionEN ? String(descriptionEN) : null,
        descriptionAR: descriptionAR ? String(descriptionAR) : null,
        images: imgs,
        wholesaleMinPrice,
        wholesaleMaxPrice,
        retailMinPrice,
        retailMaxPrice,
        unitType,
      } as any
    })

    return NextResponse.json({ ok: true, id: product.id })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
