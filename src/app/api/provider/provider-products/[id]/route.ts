import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isProvider } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function DELETE(request: Request, context: { params: any }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isProvider(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const { params } = context
    const id = params.id
    // Ensure the product belongs to provider
    const prod = await prisma.providerProduct.findUnique({ where: { id }, select: { providerId: true } })
    if (!prod) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider || provider.id !== prod.providerId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    await prisma.providerProduct.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function PUT(request: Request, context: { params: any }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isProvider(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const { params } = context
    const id = params.id
    const body = await request.json()

    const prod = await prisma.providerProduct.findUnique({
      where: { id },
      include: {
        catalogProduct: {
          select: {
            wholesaleMinPrice: true,
            wholesaleMaxPrice: true,
            retailMinPrice: true,
            retailMaxPrice: true,
            nameEN: true,
            nameAR: true,
          },
        },
      },
    })
    if (!prod) return NextResponse.json({ error: 'not found' }, { status: 404 })
    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider || provider.id !== prod.providerId) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const newWholesale = body.wholesalePrice !== undefined ? Number(body.wholesalePrice) : prod.wholesalePrice
    const newRetail = body.retailPrice !== undefined ? Number(body.retailPrice) : prod.retailPrice
    const newSelling = body.sellingPrice !== undefined ? Number(body.sellingPrice) : prod.sellingPrice

    if (prod.catalogProduct) {
      const catalog = prod.catalogProduct
      if (body.wholesalePrice !== undefined && catalog.wholesaleMaxPrice > 0 && (newWholesale < catalog.wholesaleMinPrice || newWholesale > catalog.wholesaleMaxPrice)) {
        return NextResponse.json({ error: `Wholesale price must be between ${catalog.wholesaleMinPrice} and ${catalog.wholesaleMaxPrice}` }, { status: 400 })
      }
      if (body.retailPrice !== undefined && catalog.retailMaxPrice > 0 && (newRetail < catalog.retailMinPrice || newRetail > catalog.retailMaxPrice)) {
        return NextResponse.json({ error: `Retail price must be between ${catalog.retailMinPrice} and ${catalog.retailMaxPrice}` }, { status: 400 })
      }
    }

    // Determine whether the change is a price change vs a stock change
    const priceChanged = (
      (body.sellingPrice !== undefined && Number(body.sellingPrice) !== prod.sellingPrice) ||
      (body.wholesalePrice !== undefined && Number(body.wholesalePrice) !== prod.wholesalePrice) ||
      (body.retailPrice !== undefined && Number(body.retailPrice) !== prod.retailPrice)
    )

    const stockChanged = (body.stockQuantity !== undefined && Number(body.stockQuantity) !== prod.stockQuantity)

    const data: any = {}

    // If prices changed on an already approved product, mark it pending approval
    if (priceChanged && prod.status === 'APPROVED') {
      data.status = 'PENDING_APPROVAL'
      data.priceApproved = false
      if (body.sellingPrice !== undefined) data.sellingPrice = newSelling
      if (body.wholesalePrice !== undefined) data.wholesalePrice = newWholesale
      if (body.retailPrice !== undefined) data.retailPrice = newRetail
    } else {
      if (body.sellingPrice !== undefined) data.sellingPrice = newSelling
      if (body.wholesalePrice !== undefined) data.wholesalePrice = newWholesale
      if (body.retailPrice !== undefined) data.retailPrice = newRetail
    }

    // Stock updates apply immediately and do not affect approval status
    if (body.stockQuantity !== undefined) data.stockQuantity = Number(body.stockQuantity)

    const updated = await prisma.providerProduct.update({ where: { id }, data })

    // If price was changed and we moved an APPROVED product to PENDING_APPROVAL,
    // notify admins and create an audit log entry
    if (priceChanged && prod.status === 'APPROVED') {
      // create notifications for all admin users
      try {
        const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
        if (admins.length) {
          const records = admins.map(a => ({
            userId: a.id,
            type: 'SYSTEM',
            titleAR: 'طلب تغيير سعر',
            titleEN: 'Price change requested',
            bodyAR: `المزود طلب تغيير سعر المنتج ${prod.catalogProduct?.nameAR || prod.catalogProduct?.nameEN || ''}`,
            bodyEN: `Provider requested a price change for ${prod.catalogProduct?.nameEN || prod.catalogProduct?.nameAR || ''}`,
            data: { providerId: prod.providerId, providerProductId: updated.id, catalogProductId: prod.catalogProductId },
          }))
          try { await prisma.notification.createMany({ data: records as any }) } catch (e) { /* ignore */ }
        }
      } catch (e) {
        console.error('[provider-products] notify admins error', (e as any)?.message ?? e)
      }

      await prisma.auditLog.create({
        data: {
          userId: current.id,
          action: 'REQUEST_PRICE_CHANGE',
          entity: 'ProviderProduct',
          entityId: id,
          details: { was: { sellingPrice: prod.sellingPrice, wholesalePrice: prod.wholesalePrice, retailPrice: prod.retailPrice }, now: { sellingPrice: data.sellingPrice, wholesalePrice: data.wholesalePrice, retailPrice: data.retailPrice } },
        },
      })
    }

    return NextResponse.json({ ok: true, updated })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
