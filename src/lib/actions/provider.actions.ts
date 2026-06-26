import { prisma } from '@/lib/prisma'

export async function getFirstProvider() {
  return await prisma.providerProfile.findFirst({ include: { user: true } })
}

export async function getProductsByProviderId(providerId: string) {
  return await prisma.providerProduct.findMany({
    where: { providerId },
    include: { catalogProduct: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateStoreProfile(providerId: string, data: Record<string, unknown>) {
  const updateData: any = {
    shopNameAR: (data as any).shopNameAR,
    shopNameEN: (data as any).shopNameEN,
    descriptionAR: (data as any).descriptionAR,
    descriptionEN: (data as any).descriptionEN,
    logo: (data as any).logo || undefined,
    banner: (data as any).banner || undefined,
    locationPhoto: (data as any).locationPhoto || undefined,
  }

  if ((data as any).defaultWholesaleUnit !== undefined) {
    updateData.defaultWholesaleUnit = (data as any).defaultWholesaleUnit
  }

  const updated = await prisma.providerProfile.update({ where: { id: providerId }, data: updateData })

  // If a locationPhoto was provided, also update the associated user's avatar
  const locPhoto = (data as any).locationPhoto
  if (locPhoto) {
    try {
      const prov = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { userId: true } })
      if (prov?.userId) {
        await prisma.user.update({ where: { id: prov.userId }, data: { avatar: locPhoto } })
      }
    } catch (err) {
      console.error('Failed to update user avatar from locationPhoto', err)
    }
  }

  return updated
}

export async function getOrdersByProvider(providerId: string) {
  return await prisma.order.findMany({
    where: { providerId },
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listCatalogProducts(filter?: Record<string, unknown>) {
  return await prisma.catalogProduct.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function createProviderProduct(providerId: string, catalogProductId: string, sellingPrice: number, stockQuantity: number, wholesalePrice?: number, retailPrice?: number, options?: Record<string, unknown>[], wholesaleUnit?: string) {
  // Avoid duplicate listings: return an existing pending approval record, otherwise fail
  const existing = await prisma.providerProduct.findFirst({ where: { providerId, catalogProductId } })
  if (existing) {
    if (existing.status === 'PENDING_APPROVAL') return existing
    throw new Error('This product is already listed by your store.')
  }
  // if wholesaleUnit not provided, fall back to provider default
    if (!wholesaleUnit) {
      const prov: any = await prisma.providerProfile.findUnique({ where: { id: providerId } })
      wholesaleUnit = prov?.defaultWholesaleUnit || undefined
    }
    const pp = await prisma.providerProduct.create({
      data: {
        providerId,
        catalogProductId,
        sellingPrice,
        wholesalePrice: wholesalePrice ?? sellingPrice,
        retailPrice: retailPrice ?? 0,
        stockQuantity,
        status: 'PENDING_APPROVAL',
      },
    })

  if (options && options.length > 0) {
    // map options to DB records
    const data = options.map((o) => ({
      providerProductId: pp.id,
      unitType: String((o as Record<string, unknown>)['unitType'] || ''),
      price: Number((o as Record<string, unknown>)['price'] ?? sellingPrice),
      minQuantity: Number((o as Record<string, unknown>)['minQuantity'] ?? 1),
      maxQuantity: (o as Record<string, unknown>)['maxQuantity'] ? Number((o as Record<string, unknown>)['maxQuantity']) : null,
      stockQuantity: Number((o as Record<string, unknown>)['stockQuantity'] ?? 0),
    }))
    try {
      await prisma.providerProductOption.createMany({ data: data as any })
    } catch (err) {
      console.error('createProviderProduct options error', err)
    }
  }

  return pp
}
