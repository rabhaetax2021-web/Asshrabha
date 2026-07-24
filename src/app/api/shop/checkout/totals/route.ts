import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildCheckoutTotals } from '@/lib/order-pricing'
import { resolveProductPrice } from '@/lib/cart-price'
import { z } from 'zod'

const checkoutTotalsSchema = z.object({
  items: z.array(z.object({
    providerProductId: z.string().min(1),
    quantity: z.number().int().positive(),
    optionId: z.string().optional(),
  })),
  addressId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = checkoutTotalsSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
    }

    const { items, addressId } = parsed.data
    const buyerIsShop = !!currentUser && (currentUser.role === 'PROVIDER' || currentUser.customerType === 'SHOP')

    const resolvedItems: Array<{ quantity: number; price: number }> = []
    const providerIds = new Set<string>()

    for (const item of items) {
      const providerProduct = await prisma.providerProduct.findUnique({
        where: { id: item.providerProductId },
        include: { provider: true },
      })
      if (!providerProduct) continue
      providerIds.add(providerProduct.providerId)

      let optionPrice: number | undefined
      if (item.optionId) {
        const option = await prisma.providerProductOption.findUnique({ where: { id: item.optionId } })
        optionPrice = option?.price ? Number(option.price) : undefined
      }

      const price = resolveProductPrice(providerProduct as any, buyerIsShop, optionPrice)
      resolvedItems.push({ quantity: item.quantity, price: Number(price || 0) })
    }

    let shipping = 0
    if (addressId) {
      const address = await prisma.address.findUnique({ where: { id: addressId }, select: { locationId: true } })
      if (address?.locationId) {
        for (const providerId of providerIds) {
          const zone = await prisma.deliveryZone.findFirst({
            where: { providerId, locationId: address.locationId, isActive: true },
            select: { shippingPrice: true },
          })
          shipping += Number(zone?.shippingPrice || 0)
        }
      }
    }

    const totals = buildCheckoutTotals(resolvedItems, shipping)
    return NextResponse.json({ ok: true, totals })
  } catch (error) {
    console.error('[checkout-totals]', error)
    return NextResponse.json({ error: 'Unable to calculate checkout totals.' }, { status: 500 })
  }
}
