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

export async function updateStoreProfile(providerId: string, data: any) {
  return await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      shopNameAR: data.shopNameAR,
      shopNameEN: data.shopNameEN,
      descriptionAR: data.descriptionAR,
      descriptionEN: data.descriptionEN,
      logo: data.logo || undefined,
      banner: data.banner || undefined,
      locationPhoto: data.locationPhoto || undefined,
    },
  })
}

export async function getOrdersByProvider(providerId: string) {
  return await prisma.order.findMany({
    where: { providerId },
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function listCatalogProducts(filter?: any) {
  return await prisma.catalogProduct.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}

export async function createProviderProduct(providerId: string, catalogProductId: string, sellingPrice: number, stockQuantity: number, wholesalePrice?: number, retailPrice?: number, options?: any[]) {
  // Avoid duplicate listings: return existing if present
  const existing = await prisma.providerProduct.findFirst({ where: { providerId, catalogProductId } })
  if (existing) return existing

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
    const data = options.map((o: any) => ({
      providerProductId: pp.id,
      unitType: o.unitType,
      price: Number(o.price || sellingPrice),
      minQuantity: Number(o.minQuantity || 1),
      maxQuantity: o.maxQuantity ? Number(o.maxQuantity) : null,
      stockQuantity: Number(o.stockQuantity || 0),
    }))
    try {
      await prisma.providerProductOption.createMany({ data })
    } catch (err) {
      console.error('createProviderProduct options error', err)
    }
  }

  return pp
}
