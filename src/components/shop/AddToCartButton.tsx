"use client"
import React from 'react'
import { useCartStore } from '@/stores/cartStore'
import { showToast } from '@/components/ui/toast'

export default function AddToCartButton({ product }: { product: any }) {
  const add = useCartStore(state => state.addItem)
  const handle = () => {
    try {
      add({ providerProductId: product.id, quantity: 1, title: product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || 'Product', price: product.retailPrice || product.sellingPrice })
      showToast('Added to cart', 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }
  return (
    <button onClick={handle} className="btn btn-sm" style={{ marginLeft: 8 }}>Add</button>
  )
}
