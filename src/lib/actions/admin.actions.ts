import { prisma } from "@/lib/prisma";

export async function getProviders() {
  return await prisma.providerProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function getProviderById(id: string) {
  return await prisma.providerProfile.findUnique({
    where: { id },
    include: { user: true, products: true },
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

export async function approveSuggestion(suggestionId: string, adminUserId?: string, note?: string) {
  const sug = await prisma.productSuggestion.update({
    where: { id: suggestionId },
    data: { status: 'APPROVED', adminNote: note || null },
    include: { provider: { include: { user: true } } },
  })

  await prisma.notification.create({
    data: {
      userId: sug.provider.userId,
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

  return sug
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
