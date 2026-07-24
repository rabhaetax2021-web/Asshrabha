export interface ProviderPurchaseCondition {
  minOrderItems?: number | null
  minOrderAmount?: number | null
  shopNameEN?: string | null
  shopNameAR?: string | null
}

export interface PurchaseConditionCheckResult {
  ok: boolean
  messageEN?: string
  messageAR?: string
}

export function validateProviderPurchaseConditions(
  condition: ProviderPurchaseCondition | null | undefined,
  items: Array<{ quantity: number; price: number }>,
  locale: string = 'en'
): PurchaseConditionCheckResult {
  if (!condition) return { ok: true }

  const minItems = Number(condition.minOrderItems ?? 0)
  const minAmount = Number(condition.minOrderAmount ?? 0)

  if (!Number.isFinite(minItems) && !Number.isFinite(minAmount)) return { ok: true }

  const totalQuantity = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const totalAmount = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0)

  const failsItems = minItems > 0 && totalQuantity < minItems
  const failsAmount = minAmount > 0 && totalAmount < minAmount

  if (!failsItems && !failsAmount) return { ok: true }

  const shopName = locale === 'ar'
    ? (condition.shopNameAR || condition.shopNameEN || 'المتجر')
    : (condition.shopNameEN || condition.shopNameAR || 'the seller')

  const summaryEN = `${shopName} requires a minimum order of ${minItems > 0 ? `${minItems} item${minItems === 1 ? '' : 's'}` : ''}${minItems > 0 && minAmount > 0 ? ' and ' : ''}${minAmount > 0 ? `EGP ${minAmount}` : ''}.`
  const summaryAR = `${shopName} يتطلب طلبًا حدّيًا لا يقل عن ${minItems > 0 ? `${minItems} عنصر${minItems === 1 ? '' : 'ات'}` : ''}${minItems > 0 && minAmount > 0 ? ' و' : ''}${minAmount > 0 ? `وحدات بقيمة ${minAmount} جنيه` : ''}.`

  return {
    ok: false,
    messageEN: `Your order did not meet ${shopName}'s required purchase conditions. ${summaryEN}`,
    messageAR: `لم يحقق طلبك الشروط المطلوبة من ${shopName}. ${summaryAR}`,
  }
}
