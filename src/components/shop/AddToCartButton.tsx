"use client"

import { useTranslations } from 'next-intl'
import { useCartStore } from '@/stores/cartStore'
import { showToast } from '@/components/ui/toast'
import { resolveProductPrice } from '@/lib/cart-price'

export default function AddToCartButton({ product, style }: { product: any; style?: React.CSSProperties }) {
  const t = useTranslations('shop')
  const add = useCartStore(state => state.addItem)

  const handle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      const sessionRes = await fetch('/api/auth/session')
      const data = await sessionRes.json().catch(() => ({}))
      const isShop = !!data?.user && (data.user.role === 'PROVIDER' || data.user.customerType === 'SHOP')
      const price = resolveProductPrice(product, isShop)
      add({ providerProductId: product.id, quantity: 1, title: product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || 'Product', price })
      showToast(t('addedToCart') || 'Added to cart', 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="btn btn-sm"
      style={{ marginLeft: 8, flexShrink: 0, minWidth: '6rem', ...style }}
    >
      {t('addToCart') || 'Add to Cart'}
    </button>
  )
}
