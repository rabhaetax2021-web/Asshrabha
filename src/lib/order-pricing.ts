import type { PrismaClient } from '@prisma/client'

export function buildCheckoutTotals(items: Array<{ quantity: number; price: number }>, shipping: number | string = 0) {
  const itemsSubtotal = items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0)
  const shippingPrice = Number(shipping || 0)
  return {
    itemsSubtotal,
    shipping: shippingPrice,
    totalAmount: itemsSubtotal + shippingPrice,
  }
}

export async function calculateOrderTotals(prismaLike: Pick<PrismaClient, 'orderItem' | 'order' | 'address' | 'deliveryZone'>, orderId: string, providerId?: string) {
  const items = await prismaLike.orderItem.findMany({ where: { orderId } })
  const itemsTotal = items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)

  let shippingPrice = 0
  const order = await prismaLike.order.findUnique({
    where: { id: orderId },
    select: { addressId: true, providerId: true },
  })

  if (order?.addressId) {
    const address = await prismaLike.address.findUnique({ where: { id: order.addressId }, select: { locationId: true } })
    if (address?.locationId) {
      const zone = await prismaLike.deliveryZone.findFirst({
        where: { providerId: providerId || order.providerId, locationId: address.locationId, isActive: true },
        select: { shippingPrice: true },
      })
      shippingPrice = Number(zone?.shippingPrice || 0)
    }
  }

  return { itemsTotal, shippingPrice, totalAmount: itemsTotal + shippingPrice }
}
