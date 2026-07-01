import { prisma } from "@/lib/prisma";

export async function getProviders() {
  // Exclude users that are admin accounts (ROOT_ADMIN / SUB_ADMIN)
  return await prisma.providerProfile.findMany({
    where: { user: { role: { notIn: ["ROOT_ADMIN", "SUB_ADMIN"] } } },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getProviderById(id: string) {
  return await prisma.providerProfile.findUnique({
    where: { id },
    include: { user: true, products: true, orders: true },
  });
}

export async function approveProvider(providerId: string, adminUserId?: string, note?: string) {
  const provider = await prisma.providerProfile.update({
    where: { id: providerId },
    data: { isVisible: true },
    include: { user: true },
  });

  // Update user status
  await prisma.user.update({
    where: { id: provider.userId },
    data: { status: "APPROVED" },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: provider.userId,
      type: "ACCOUNT_APPROVED",
      titleAR: "تمت الموافقة على حسابك",
      titleEN: "Your account has been approved",
      bodyAR: note || null,
      bodyEN: note || null,
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: "APPROVE_PROVIDER",
      entity: "ProviderProfile",
      entityId: providerId,
      details: note ? { note } : {},
    },
  });

  return provider;
}

export async function rejectProvider(providerId: string, adminUserId?: string, note?: string) {
  const provider = await prisma.providerProfile.update({
    where: { id: providerId },
    data: { isVisible: false },
    include: { user: true },
  });

  await prisma.user.update({
    where: { id: provider.userId },
    data: { status: "REJECTED" },
  });

  await prisma.notification.create({
    data: {
      userId: provider.userId,
      type: "ACCOUNT_REJECTED",
      titleAR: "تم رفض حسابك",
      titleEN: "Your account has been rejected",
      bodyAR: note || null,
      bodyEN: note || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: "REJECT_PROVIDER",
      entity: "ProviderProfile",
      entityId: providerId,
      details: note ? { note } : {},
    },
  });

  return provider;
}

export async function suspendProvider(providerId: string, adminUserId?: string, note?: string) {
  const provider = await prisma.providerProfile.update({
    where: { id: providerId },
    data: { isVisible: false },
    include: { user: true },
  })

  await prisma.user.update({
    where: { id: provider.userId },
    data: { status: 'SUSPENDED' },
  })

  await prisma.notification.create({
    data: {
      userId: provider.userId,
      type: 'SYSTEM',
      titleAR: 'تم إيقاف حسابك',
      titleEN: 'Your account has been suspended',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'SUSPEND_PROVIDER',
      entity: 'ProviderProfile',
      entityId: providerId,
      details: note ? { note } : {},
    },
  })

  return provider
}

export async function setProviderVisibility(providerId: string, visible: boolean, adminUserId?: string, note?: string) {
  const provider = await prisma.providerProfile.update({
    where: { id: providerId },
    data: { isVisible: visible },
    include: { user: true },
  })

  // Optionally notify provider about visibility change
  await prisma.notification.create({
    data: {
      userId: provider.userId,
      type: 'SYSTEM',
      titleAR: visible ? 'تم إظهار متجرك' : 'تم إخفاء متجرك',
      titleEN: visible ? 'Your store is visible' : 'Your store has been hidden',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: visible ? 'SHOW_PROVIDER' : 'HIDE_PROVIDER',
      entity: 'ProviderProfile',
      entityId: providerId,
      details: note ? { note } : {},
    },
  })

  return provider
}

export async function setProviderLocation(providerId: string, lat?: number | null, lng?: number | null, adminUserId?: string, locationAddress?: string | null, mapsLink?: string | null) {
  const data: Record<string, unknown> = {}
  if (typeof lat === 'number') data.locationLat = lat
  if (typeof lng === 'number') data.locationLng = lng
  if (typeof locationAddress === 'string') data.locationAddress = locationAddress
  if (typeof mapsLink === 'string') data.locationPhoto = (mapsLink as unknown) // reuse locationPhoto field? better to save mapsLink in description? We'll use locationAddress for now

  const provider = await prisma.providerProfile.update({
    where: { id: providerId },
    data,
    include: { user: true },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'SET_PROVIDER_LOCATION',
      entity: 'ProviderProfile',
      entityId: providerId,
      details: { lat, lng, locationAddress, mapsLink },
    },
  })

  return provider
}

export async function suspendCustomer(userId: string, adminUserId?: string, note?: string) {
  await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } })

  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'SYSTEM',
      titleAR: 'تم إيقاف حسابك',
      titleEN: 'Your account has been suspended',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'SUSPEND_CUSTOMER',
      entity: 'User',
      entityId: userId,
      details: note ? { note } : {},
    },
  })

  return true
}

export async function approveCustomer(userId: string, adminUserId?: string, note?: string) {
  const user = await prisma.user.update({ where: { id: userId }, data: { status: 'APPROVED' } })

  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'ACCOUNT_APPROVED',
      titleAR: 'تمت الموافقة على حسابك',
      titleEN: 'Your account has been approved',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'APPROVE_CUSTOMER',
      entity: 'User',
      entityId: userId,
      details: note ? { note } : {},
    },
  })

  return user
}

export async function rejectCustomer(userId: string, adminUserId?: string, note?: string) {
  const user = await prisma.user.update({ where: { id: userId }, data: { status: 'REJECTED' } })

  await prisma.notification.create({
    data: {
      userId: userId,
      type: 'ACCOUNT_REJECTED',
      titleAR: 'تم رفض حسابك',
      titleEN: 'Your account has been rejected',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'REJECT_CUSTOMER',
      entity: 'User',
      entityId: userId,
      details: note ? { note } : {},
    },
  })

  return user
}

export async function getPendingProviders() {
  return await prisma.providerProfile.findMany({
    where: { user: { status: 'PENDING' } },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function getPendingProviderProducts() {
  return await prisma.providerProduct.findMany({
    where: { status: 'PENDING_APPROVAL' },
    include: { provider: { include: { user: true } }, catalogProduct: true },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveProviderProduct(productId: string, adminUserId?: string, note?: string) {
  const prod = await prisma.providerProduct.update({
    where: { id: productId },
    data: { status: 'APPROVED', priceApproved: true },
    include: { provider: { include: { user: true } }, catalogProduct: true },
  })

  // notify provider
  await prisma.notification.create({
    data: {
      userId: prod.provider.userId,
      type: 'PRODUCT_APPROVED',
      titleAR: 'تمت الموافقة على منتجك',
      titleEN: 'Your product was approved',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'APPROVE_PROVIDER_PRODUCT',
      entity: 'ProviderProduct',
      entityId: productId,
      details: note ? { note } : {},
    },
  })

  return prod
}

export async function rejectProviderProduct(productId: string, adminUserId?: string, note?: string) {
  const prod = await prisma.providerProduct.update({
    where: { id: productId },
    data: { status: 'REJECTED' },
    include: { provider: { include: { user: true } }, catalogProduct: true },
  })

  await prisma.notification.create({
    data: {
      userId: prod.provider.userId,
      type: 'PRODUCT_REJECTED',
      titleAR: 'تم رفض منتجك',
      titleEN: 'Your product was rejected',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'REJECT_PROVIDER_PRODUCT',
      entity: 'ProviderProduct',
      entityId: productId,
      details: note ? { note } : {},
    },
  })

  return prod
}

export async function getPendingSuggestions() {
  return await prisma.productSuggestion.findMany({
    where: { status: 'PENDING' },
    include: { provider: { include: { user: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function approveSuggestion(
  suggestionId: string,
  adminUserId?: string,
  note?: string,
  rangeData?: {
    wholesaleMinPrice: number
    wholesaleMaxPrice: number
    retailMinPrice: number
    retailMaxPrice: number
    categoryId?: string
    unitType?: 'PIECE' | 'BOX' | 'PACK'
  }
) {
  const suggestion = await prisma.productSuggestion.findUnique({
    where: { id: suggestionId },
    include: { provider: { include: { user: true } } },
  })
  if (!suggestion) throw new Error('Suggestion not found')
  if (!rangeData) throw new Error('Price range data is required')

  const category = rangeData.categoryId
    ? await prisma.category.findUnique({ where: { id: rangeData.categoryId } })
    : suggestion.categorySuggestion
      ? await prisma.category.findFirst({
          where: {
            OR: [
              { slug: suggestion.categorySuggestion },
              { nameEN: suggestion.categorySuggestion },
              { nameAR: suggestion.categorySuggestion },
            ],
          },
        })
      : null

  const fallbackCategory = category ?? await prisma.category.findFirst({ orderBy: { createdAt: 'asc' } })
  if (!fallbackCategory) throw new Error('No category available to assign catalog product')

  const catalogProduct = await prisma.catalogProduct.create({
    data: {
      categoryId: fallbackCategory.id,
      nameEN: suggestion.nameEN,
      nameAR: suggestion.nameAR,
      descriptionEN: suggestion.descriptionEN || null,
      descriptionAR: suggestion.descriptionAR || null,
      images: suggestion.images || [],
      wholesaleMinPrice: rangeData.wholesaleMinPrice,
      wholesaleMaxPrice: rangeData.wholesaleMaxPrice,
      retailMinPrice: rangeData.retailMinPrice,
      retailMaxPrice: rangeData.retailMaxPrice,
      unitType: rangeData.unitType || 'PACK',
      wholesalePrice: rangeData.wholesaleMinPrice,
      retailPrice: rangeData.retailMinPrice,
      status: 'ACTIVE',
    } as any,
  })

  const sug = await prisma.productSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'MERGED', adminNote: note || null },
  })

  await prisma.notification.create({
    data: {
      userId: suggestion.provider.userId,
      type: 'SUGGESTION_STATUS',
      titleAR: 'تمت الموافقة على اقتراحك',
      titleEN: 'Your suggestion was approved',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'APPROVE_SUGGESTION',
      entity: 'ProductSuggestion',
      entityId: suggestionId,
      details: note ? { note } : {},
    },
  })

  return { suggestion: sug, catalogProduct }
}

export async function rejectSuggestion(suggestionId: string, adminUserId?: string, note?: string) {
  const sug = await prisma.productSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'REJECTED', adminNote: note || null },
    include: { provider: { include: { user: true } } },
  })

  await prisma.notification.create({
    data: {
      userId: sug.provider.userId,
      type: 'SUGGESTION_STATUS',
      titleAR: 'تم رفض اقتراحك',
      titleEN: 'Your suggestion was rejected',
      bodyAR: note || null,
      bodyEN: note || null,
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: adminUserId || null,
      action: 'REJECT_SUGGESTION',
      entity: 'ProductSuggestion',
      entityId: suggestionId,
      details: note ? { note } : {},
    },
  })

  return sug
}
