import { prisma } from '@/lib/prisma'

export async function browseProducts({ categorySlug, take = 20, skip = 0 }: any = {}) {
  const where: any = { status: 'ACTIVE' }
  if (categorySlug) where.category = { slug: categorySlug }

  return await prisma.catalogProduct.findMany({ where, take, skip, include: { category: true } })
}

export async function getProductById(id: string) {
  if (!id) return null

  // Try providerProduct first (provider-specific listing)
  const providerProduct = await prisma.providerProduct.findUnique({ where: { id }, include: { catalogProduct: true, provider: true } })
  if (providerProduct) return { kind: 'provider', data: providerProduct }

  // Fallback to catalogProduct
  const catalogProduct = await prisma.catalogProduct.findUnique({ where: { id }, include: { category: true, unitRanges: true } })
  if (catalogProduct) return { kind: 'catalog', data: catalogProduct }

  return null
}

export async function placeOrder(customerId: string, cartItems: any[], addressId?: string) {
  // Group items by provider via providerProduct -> providerId
  return await prisma.$transaction(async (tx) => {
    const orders: any[] = []

    // Resolve provider products and group
    const resolved = await Promise.all(cartItems.map(async (ci) => {
      const pp = await tx.providerProduct.findUnique({ where: { id: ci.providerProductId }, include: { provider: true, catalogProduct: true } })
      return { ...ci, providerProduct: pp }
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
      const totalAmount = items.reduce((s:any,i:any) => s + (i.quantity * i.providerProduct.sellingPrice), 0)
      const order = await tx.order.create({ data: {
        orderNumber,
        customerId,
        providerId,
        addressId: addressId || undefined,
        totalAmount,
        platformFee: 0,
      }})

      for (const it of items) {
        await tx.orderItem.create({ data: {
          orderId: order.id,
          providerProductId: it.providerProduct.id,
          quantity: it.quantity,
          unitPrice: it.providerProduct.sellingPrice,
          totalPrice: it.quantity * it.providerProduct.sellingPrice,
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

      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: 'PENDING' } })
      orders.push(order)
    }

    return orders
  })
}
