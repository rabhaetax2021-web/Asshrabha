"use client"
import { useEffect, useState } from 'react';
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'
import { useCartStore } from '@/stores/cartStore'
import { resolveProductPrice } from '@/lib/cart-price'

type Option = { id: string; title?: string; price?: number; unitType?: string }
type CatalogOption = { unitType: string; minPrice?: number; maxPrice?: number }

export default function AddToCart({ providerProductId, catalogProductId, className }: { providerProductId?: string, catalogProductId?: string, className?: string }) {
  const [loading, setLoading] = useState(false)
  const addItem = useCartStore(s => s.addItem)
  const setOpen = useCartStore(s => s.setOpen)
  const [quantity, setQuantity] = useState(1)
  const [options, setOptions] = useState<Option[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [productName, setProductName] = useState<string | undefined>(undefined)
  const [productPrice, setProductPrice] = useState<number | undefined>(undefined)
  const [productImage, setProductImage] = useState<string | undefined>(undefined)
  const [isShop, setIsShop] = useState<boolean>(false)
  const [catalogOptions, setCatalogOptions] = useState<CatalogOption[]>([])
  const [selectedCatalogOption, setSelectedCatalogOption] = useState<string | null>(null)

  useEffect(() => {
    if (!providerProductId) return
    ;(async () => {
      try {
        const res = await fetch(`/api/provider/provider-product?id=${encodeURIComponent(providerProductId)}`)
        if (!res.ok) return
        const j = await res.json()
        const opts = j.product?.providerProductOptions || []
        setOptions(opts)
        if (opts.length > 0) setSelectedOption(opts[0].id)
        // store a cached title/price/image to use when adding to cart
        // prefer catalog product name (EN) then AR then fallback
        const catalog = j.product?.catalogProduct
        if (catalog) setProductName(catalog.nameEN || catalog.nameAR || undefined)
        const img = j.product?.catalogProduct?.images?.[0] || j.product?.images?.[0] || undefined
        if (img) setProductImage(img)
        // determine buyer role (client or shop) and cache the normalized price
        try {
          const s = await fetch('/api/auth/session').then(r => r.json()).catch(() => ({}))
          const shop = !!s?.user && (s.user.role === 'PROVIDER' || s.user.customerType === 'SHOP')
          setIsShop(shop)
          const computed = resolveProductPrice(j.product, shop)
          setProductPrice(computed)
        } catch (e) {
          setProductPrice(resolveProductPrice(j.product, false))
        }
      } catch (err) {
        // ignore
      }
    })()
  }, [providerProductId])

  useEffect(() => {
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
        const optionPrice = typeof opt?.price === 'number' ? opt.price : undefined
        const price = resolveProductPrice({
          retailPrice: productPrice && !isShop ? productPrice : undefined,
          wholesalePrice: productPrice && isShop ? productPrice : undefined,
          sellingPrice: productPrice,
        }, isShop, optionPrice)
        const image = productImage || undefined
        addItem({ providerProductId, optionId: selectedOption || undefined, unitType: opt?.unitType, quantity: Number(quantity || 1), title, price, image })
        try { setOpen(true) } catch (e) {}
        showToast('Added to cart', 'success')
        setLoading(false)
        return
      }

      const form = new FormData()
      if (catalogProductId) form.append('catalogProductId', catalogProductId)
      form.append('quantity', String(quantity || 1))
      if (selectedCatalogOption) form.append('unitType', selectedCatalogOption)

      const res = await fetch('/api/cart/add', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add to cart')
      // If server suggests a redirect (to product page), add the chosen listing to the local cart before navigation.
      if (data?.redirect) {
        if (data?.providerProductId) {
          const title = data.title || undefined
          const price = data.unitPrice ?? undefined
          const image = productImage || undefined
          addItem({ providerProductId: data.providerProductId, optionId: undefined, unitType: selectedCatalogOption || undefined, quantity: Number(quantity || 1), title, price, image })
          try { setOpen(true) } catch (e) {}
        }
        window.location.href = data.redirect
        return
      }

      // If server returned an item with unitPrice, add it to client cart as convenience
      if (data?.providerProduct) {
        const pp = data.providerProduct
        const title = pp.title || undefined
        const price = pp.unitPrice ?? undefined
        const image = pp.catalogProduct?.images?.[0] || pp.images?.[0] || undefined
        addItem({ providerProductId: pp.id, optionId: undefined, unitType: pp.unitType, quantity: Number(quantity || 1), title, price, image })
        try { setOpen(true) } catch (e) {}
        showToast('Added to cart', 'success')
        return
      }

      showToast('Added to cart', 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={doAdd} className={`add-to-cart-form ${className || ''}`.trim()} onClick={e => e.stopPropagation()}>
      <div className="add-to-cart-controls">
        <input type="number" min={1} value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
        {options.length > 0 && (
          <select value={selectedOption || ''} onChange={e => setSelectedOption(e.target.value)}>
            {options.map(o => <option key={o.id} value={o.id}>{o.unitType} - {o.price} EGP</option>)}
          </select>
        )}
        {catalogOptions.length > 0 && (
          <select value={selectedCatalogOption || ''} onChange={e => setSelectedCatalogOption(e.target.value)}>
            {catalogOptions.map((o) => <option key={o.unitType} value={o.unitType}>{o.unitType} - {o.minPrice} - {o.maxPrice} EGP</option>)}
          </select>
        )}
        <button type="submit" disabled={loading} className="btn btn-primary">{loading ? 'Adding...' : 'Add to Cart'}</button>
      </div>
    </form>
  )
}
