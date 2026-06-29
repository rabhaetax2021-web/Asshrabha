"use client"

import { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import { showToast } from '@/components/ui/toast'

export default function AddToCartButton({ product }: { product: any }) {
  const add = useCartStore(state => state.addItem)
  const [isShop, setIsShop] = useState(false)

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        setIsShop(!!data?.user && (data.user.role === 'PROVIDER' || data.user.customerType === 'SHOP'))
      })
      .catch(() => {})
  }, [])

  const handle = () => {
    try {
      add({ providerProductId: product.id, quantity: 1, title: product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || 'Product', price: isShop ? (product.wholesalePrice || product.sellingPrice) : (product.retailPrice || product.sellingPrice) })
      showToast('Added to cart', 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }
  return (
    <button onClick={handle} className="btn btn-sm" style={{ marginLeft: 8 }}>Add</button>
  )
}
