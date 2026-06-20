"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { useCartStore } from '@/stores/cartStore'

export default function AddToCart({ providerProductId, catalogProductId }: { providerProductId?: string, catalogProductId?: string }) {
  const [loading, setLoading] = useState(false)
  const addItem = useCartStore((s: any) => s.addItem)
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<any[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [productName, setProductName] = useState<string | undefined>(undefined)
  const [productPrice, setProductPrice] = useState<number | undefined>(undefined)
  const [catalogOptions, setCatalogOptions] = useState<any[]>([])
  const [selectedCatalogOption, setSelectedCatalogOption] = useState<string | null>(null)

  React.useEffect(() => {
    if (!providerProductId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/provider/provider-product?id=${encodeURIComponent(providerProductId)}`)
        if (!res.ok) return
        const j = await res.json()
        const opts = j.product?.providerProductOptions || []
        setOptions(opts)
        if (opts.length > 0) setSelectedOption(opts[0].id)
        // store a cached title/price to use when adding to cart
        // prefer catalog product name (EN) then AR then fallback
        const catalog = j.product?.catalogProduct
        if (catalog) setProductName(catalog.nameEN || catalog.nameAR || undefined)
        // also cache selling price
        if (j.product?.sellingPrice) setProductPrice(j.product.sellingPrice)
      } catch (err) {
        // ignore
      }
    })()
  }, [providerProductId])

  React.useEffect(() => {
    if (!catalogProductId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/catalog/product?id=${encodeURIComponent(catalogProductId)}`)
        if (!res.ok) return
        const j = await res.json()
        const ranges = j.product?.unitRanges || []
        setCatalogOptions(ranges)
        if (ranges.length > 0) setSelectedCatalogOption(ranges[0].unitType)
      } catch (err) {
        // ignore
      }
    })()
  }, [catalogProductId])

  async function doAdd(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setLoading(true)
    try {
      if (providerProductId) {
        // add to client-side cart using selected option
        const opt = options.find(o => o.id === selectedOption)
        const title = opt?.title || productName || undefined
        const price = opt?.price ?? productPrice ?? undefined
        addItem({ providerProductId, optionId: selectedOption || undefined, unitType: opt?.unitType, quantity: Number(quantity || 1), title, price })
        showToast('Added to cart', 'success')
        setLoading(false)
        return
      }

      const form = new FormData()
      if (catalogProductId) form.append('catalogProductId', catalogProductId)
      form.append('quantity', String(quantity || 1))
      if (selectedCatalogOption) form.append('unitType', selectedCatalogOption)

      const res = await fetch('/api/cart/add', { method: 'POST', body: form })
      if (res.redirected) {
        showToast('Added to cart', 'success')
        // follow redirect
        window.location.href = res.url
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add to cart')
      showToast('Added to cart', 'success')
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={doAdd} className="add-to-cart-form">
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} style={{ width: 80 }} />
        {options.length > 0 && (
          <select value={selectedOption || ''} onChange={e => setSelectedOption(e.target.value)}>
            {options.map(o => <option key={o.id} value={o.id}>{o.unitType} - {o.price} EGP</option>)}
          </select>
        )}
        {catalogOptions.length > 0 && (
          <select value={selectedCatalogOption || ''} onChange={e => setSelectedCatalogOption(e.target.value)}>
            {catalogOptions.map((o: any) => <option key={o.unitType} value={o.unitType}>{o.unitType} - {o.minPrice} - {o.maxPrice} EGP</option>)}
          </select>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Adding...' : 'Add to Cart'}</button>
      </div>
    </form>
  )
}
