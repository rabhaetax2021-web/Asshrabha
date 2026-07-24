"use client"

import { useCartStore } from '@/stores/cartStore'
import { showToast } from '@/components/ui/toast'
import { resolveProductPrice } from '@/lib/cart-price'

export default function AddToCartButton({ product }: { product: any }) {
  const add = useCartStore(state => state.addItem)

  const handle = async () => {
    try {
      const sessionRes = await fetch('/api/auth/session')
      const data = await sessionRes.json().catch(() => ({}))
      const isShop = !!data?.user && (data.user.role === 'PROVIDER' || data.user.customerType === 'SHOP')
      const price = resolveProductPrice(product, isShop)
      add({ providerProductId: product.id, quantity: 1, title: product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || 'Product', price })
      showToast('Added to cart', 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }

  return (
    <button onClick={handle} className="btn btn-sm" style={{ marginLeft: 8 }}>Add</button>
  )
}
