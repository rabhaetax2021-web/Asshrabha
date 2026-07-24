export type CartPriceSource = {
  retailPrice?: number | null
  wholesalePrice?: number | null
  sellingPrice?: number | null
}

export function resolveProductPrice(
  product: CartPriceSource | null | undefined,
  buyerIsShop: boolean,
  optionPrice?: number | null,
): number {
  if (typeof optionPrice === 'number' && Number.isFinite(optionPrice) && optionPrice > 0) {
    return optionPrice
  }

  if (!product) return 0

  const retail = Number(product.retailPrice ?? 0)
  const wholesale = Number(product.wholesalePrice ?? 0)
  const selling = Number(product.sellingPrice ?? 0)

  if (buyerIsShop) {
    return wholesale > 0 ? wholesale : retail > 0 ? retail : selling
  }

  return retail > 0 ? retail : selling > 0 ? selling : wholesale
}
