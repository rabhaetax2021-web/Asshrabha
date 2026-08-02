import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { createNotification } from './notification.actions'
import { getCurrentUser } from '@/lib/auth'

export async function getFirstProvider() {
  const currentUser = await getCurrentUser()
  if (!currentUser?.id) return null

  return await prisma.providerProfile.findFirst({
    where: { userId: currentUser.id },
    include: { user: true },
  })
}

export async function getProductsByProviderId(providerId: string) {
  return await prisma.providerProduct.findMany({
    where: { providerId },
    include: { catalogProduct: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function updateStoreProfile(providerId: string, data: Record<string, unknown>) {
  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { id: true, userId: true, shopNameAR: true, shopNameEN: true, descriptionAR: true, descriptionEN: true, logo: true, banner: true, locationPhoto: true, defaultWholesaleUnit: true } })
  if (!provider) throw new Error('provider not found')

  const changedFields: Record<string, unknown> = {}
  const knownFields = [
    ['shopNameAR', (data as any).shopNameAR],
    ['shopNameEN', (data as any).shopNameEN],
    ['descriptionAR', (data as any).descriptionAR],
    ['descriptionEN', (data as any).descriptionEN],
    ['minOrderItems', (data as any).minOrderItems],
    ['minOrderAmount', (data as any).minOrderAmount],
    ['logo', (data as any).logo || undefined],
    ['banner', (data as any).banner || undefined],
    ['defaultWholesaleUnit', (data as any).defaultWholesaleUnit],
  ] as const

  for (const [field, value] of knownFields) {
    const currentValue = (provider as Record<string, unknown>)[field]
    if (value !== undefined && value !== currentValue) {
      changedFields[field] = value
    }
  }

  if (Object.keys(changedFields).length === 0) {
    return { ok: true, status: 'no-change', provider }
  }

  const edit = await prisma.providerProfileEdit.create({
    data: {
      providerId,
      requestedBy: provider.userId,
      changes: { providerProfile: changedFields } as Prisma.InputJsonValue,
      status: 'PENDING',
    },
  })

  const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
  await Promise.all([
    ...admins.map((admin) =>
      createNotification(
        admin.id,
        'STORE_MODIFICATION_REQUEST',
        'Store update requested',
        'تم طلب تعديل على متجر المزود',
        {
          type: 'provider_profile_edit_request',
          editId: edit.id,
          providerId,
          bodyEN: 'A provider submitted store profile changes for admin review.',
          bodyAR: 'قدم مزود تعديلات على ملف المتجر للمراجعة من الإدارة.',
        }
      )
    ),
    createNotification(
      provider.userId,
      'STORE_MODIFICATION_REQUEST',
      'Store update submitted',
      'تم إرسال طلب تعديل المتجر للمراجعة',
      {
        type: 'provider_profile_edit_submitted',
        editId: edit.id,
        providerId,
        bodyEN: 'Your store changes were submitted for admin approval.',
        bodyAR: 'تم إرسال تعديلات متجرك للموافقة من الإدارة.',
      }
    ),
  ])

  return { ok: true, status: 'pending-review', provider, edit }
}

export async function getOrdersByProvider(providerId: string) {
  return await prisma.order.findMany({
    where: { providerId },
    include: { items: true, customer: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getProviderDashboardData(providerId: string) {
  const orders = await prisma.order.findMany({
    where: { providerId },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      customer: { select: { id: true, nameEN: true, nameAR: true, mobile: true } },
    },
  })

  const pendingOrders = orders.filter((order) => String(order.status).toUpperCase() === 'PENDING').length
  const recentOrders = orders.slice(0, 5)
  const revenue = orders.reduce((sum, order) => {
    const status = String(order.status).toUpperCase()
    if (status === 'CANCELLED' || status === 'REFUNDED') return sum
    return sum + Number(order.totalAmount || 0)
  }, 0)

  return { pendingOrders, recentOrders, revenue, totalOrders: orders.length }
}

export async function getOrderByIdForProvider(providerId: string, orderId: string) {
  return await prisma.order.findFirst({
    where: { id: orderId, providerId },
    include: {
      items: { include: { providerProduct: { include: { catalogProduct: true } } } },
      customer: true,
      address: { include: { location: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  })
}

export type CatalogProductSortField = 'createdAt' | 'nameEN' | 'wholesaleMinPrice' | 'retailMinPrice'
export type SortDirection = 'asc' | 'desc'

export interface ListCatalogProductsFilter {
  excludeCatalogProductIds?: string[]
  categorySlug?: string
  sortBy?: CatalogProductSortField
  sortDir?: SortDirection
}

export async function listCatalogProducts(filter?: ListCatalogProductsFilter) {
  const where: any = {
    status: 'ACTIVE',
    ...(filter?.excludeCatalogProductIds && filter.excludeCatalogProductIds.length > 0
      ? { id: { notIn: filter.excludeCatalogProductIds } }
      : {}),
    ...(filter?.categorySlug ? { category: { slug: filter.categorySlug } } : {}),
  }

  const orderBy = filter?.sortBy
    ? { [filter.sortBy]: filter.sortDir || 'asc' }
    : { createdAt: 'desc' }

  return await prisma.catalogProduct.findMany({
    where,
    orderBy: orderBy as any,
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

  const provider = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { userId: true, shopNameEN: true, shopNameAR: true } })
  const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
  await Promise.all([
    ...admins.map((admin) =>
      createNotification(
        admin.id,
        'PRODUCT_SUBMISSION',
        'New product submitted for approval',
        'تم إرسال منتج جديد للموافقة',
        {
          type: 'provider_product_submitted',
          providerProductId: pp.id,
          providerId,
          catalogProductId,
          bodyEN: 'A provider submitted a new product listing for admin approval.',
          bodyAR: 'قدم مزود منتجًا جديدًا للموافقة من الإدارة.',
        }
      )
    ),
    ...(provider?.userId ? [createNotification(
      provider.userId,
      'PRODUCT_SUBMISSION',
      'Product submitted for approval',
      'تم إرسال المنتج للموافقة',
      {
        type: 'provider_product_submitted',
        providerProductId: pp.id,
        providerId,
        catalogProductId,
        bodyEN: 'Your product listing was submitted for admin approval.',
        bodyAR: 'تم إرسال قائمة منتجك للموافقة من الإدارة.',
      }
    )] : []),
  ])

  return pp
}
