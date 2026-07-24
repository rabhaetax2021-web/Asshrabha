import { prisma } from '@/lib/prisma'
import { calculateOrderTotals } from '@/lib/order-pricing'
import { validateProviderPurchaseConditions } from '@/lib/purchase-conditions'
import { resolveProductPrice } from '@/lib/cart-price'

export async function browseProducts(params: { categorySlug?: string; take?: number; skip?: number } = {}) {
  const { categorySlug, take = 20, skip = 0 } = params
  const where: Record<string, unknown> = { status: 'ACTIVE' }
  if (categorySlug) (where as any).category = { slug: categorySlug }

  return await prisma.catalogProduct.findMany({ where: where as any, take, skip, include: { category: true } })
}

export async function getProductById(id: string) {
  if (!id) return null

  // Try providerProduct first (provider-specific listing)
  const providerProduct = await prisma.providerProduct.findUnique({
    where: { id },
    include: { catalogProduct: true, provider: true, providerProductOptions: true },
  })
  if (providerProduct) return { kind: 'provider', data: providerProduct }

  // Fallback to catalogProduct
  const catalogProduct = await prisma.catalogProduct.findUnique({ where: { id }, include: { category: true, unitRanges: true } })
  if (catalogProduct) return { kind: 'catalog', data: catalogProduct }

  return null
}

export async function placeOrder(customerId: string, cartItems: { providerProductId: string; quantity: number; optionId?: string }[], addressId?: string, locale: string = 'en') {
  // Group items by provider via providerProduct -> providerId
  return await prisma.$transaction(async (tx) => {
    const orders: any[] = []

    // Resolve provider products and group
    const resolved = await Promise.all(cartItems.map(async (ci) => {
      const pp = await tx.providerProduct.findUnique({ where: { id: ci.providerProductId }, include: { provider: true, catalogProduct: true } })
      let option = null
      if (ci.optionId) {
        option = await tx.providerProductOption.findUnique({ where: { id: ci.optionId } })
      }
      return { ...ci, providerProduct: pp, option }
    }))

    const byProvider = new Map<string, any[]>()
    for (const item of resolved) {
      const pp = item.providerProduct
      if (!pp) continue
      const pid = pp.providerId
      if (!byProvider.has(pid)) byProvider.set(pid, [])
      const arr = byProvider.get(pid)!
      arr.push(item)
    }

    for (const [providerId, items] of byProvider.entries()) {
      const orderNumber = `ASH-${Date.now()}-${Math.floor(Math.random()*900+100)}`
      // Determine buyer role to pick wholesale vs retail
      const buyer = await tx.user.findUnique({ where: { id: customerId } })
      const buyerIsShop = !!buyer && (buyer.role === 'PROVIDER' || buyer.customerType === 'SHOP')

      const providerProfile = items[0]?.providerProduct?.provider as any
      const condition = {
        minOrderItems: providerProfile?.minOrderItems ?? null,
        minOrderAmount: providerProfile?.minOrderAmount ?? null,
        shopNameEN: providerProfile?.shopNameEN ?? null,
        shopNameAR: providerProfile?.shopNameAR ?? null,
      }
      const conditionItems = items.map((i: any) => {
        const pp = i.providerProduct
        if (!pp) return { quantity: 0, price: 0 }
        const unitPrice = resolveProductPrice(pp, buyerIsShop, i.option?.price)
        return { quantity: Number(i.quantity || 0), price: Number(unitPrice || 0) }
      })
      const conditionCheck = validateProviderPurchaseConditions(condition, conditionItems, locale)
      if (!conditionCheck.ok) {
        throw new Error(conditionCheck.messageEN || conditionCheck.messageAR || 'Required purchase conditions were not met')
      }

      const subtotal = items.reduce((s: number, i: any) => {
        const pp = i.providerProduct
        if (!pp) return s
        const unitPrice = resolveProductPrice(pp, buyerIsShop, i.option?.price)
        return s + (i.quantity * unitPrice)
      }, 0)
      const order = await tx.order.create({ data: {
        orderNumber,
        customerId,
        providerId,
        addressId: addressId || undefined,
        totalAmount: subtotal,
        platformFee: 0,
      }})

      for (const it of items) {
        const pp = it.providerProduct
        if (!pp) continue
        const unitPrice = resolveProductPrice(pp, buyerIsShop, it.option?.price)

        await tx.orderItem.create({ data: {
          orderId: order.id,
          providerProductId: pp.id,
          quantity: it.quantity,
          unitPrice,
          totalPrice: it.quantity * unitPrice,
        }})

        // deduct stock
        await tx.providerProduct.update({ where: { id: it.providerProduct.id }, data: { stockQuantity: { decrement: it.quantity } } })

        // If item referenced a ProviderProductOption (optionId), decrement its stock as well
        if (it.optionId) {
          try {
            await tx.providerProductOption.update({ where: { id: it.optionId }, data: { stockQuantity: { decrement: it.quantity } } })
          } catch (e) {
            // ignore if option not found or no stock field
          }
        }
      }

      const totals = await calculateOrderTotals(tx as any, order.id, providerId)
      await tx.order.update({ where: { id: order.id }, data: { totalAmount: totals.totalAmount } })
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: 'PENDING' } })
      orders.push({ ...order, totalAmount: totals.totalAmount })
    }

    return orders
  })
}
