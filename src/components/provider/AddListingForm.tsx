"use client"
import React from 'react'

export default function AddListingForm({ catalog, providerId }: { catalog: any; providerId: string }) {
  const [sellingPrice, setSellingPrice] = React.useState(String(catalog.minimumPrice || ''))
  const [wholesalePrice, setWholesalePrice] = React.useState(String(catalog.wholesaleMinPrice || catalog.minimumPrice || ''))
  const [retailPrice, setRetailPrice] = React.useState(String(catalog.retailMinPrice || 0))
  const [stockQuantity, setStockQuantity] = React.useState('0')
  const [options, setOptions] = React.useState<{unitType:string;price:string;stockQuantity:string;minQuantity?:string;maxQuantity?:string}[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showSuccess, setShowSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload: any = { providerId, catalogProductId: catalog.id, sellingPrice: Number(sellingPrice), wholesalePrice: Number(wholesalePrice || sellingPrice), retailPrice: Number(retailPrice || 0), stockQuantity: Number(stockQuantity) }
      if (options.length > 0) payload.options = options.map(o => ({ unitType: o.unitType, price: Number(o.price), stockQuantity: Number(o.stockQuantity), minQuantity: o.minQuantity ? Number(o.minQuantity) : undefined, maxQuantity: o.maxQuantity ? Number(o.maxQuantity) : undefined }))

      const res = await fetch('/api/provider/provider-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setShowSuccess(true)
      setTimeout(() => {
        window.location.href = '/provider/products'
      }, 1600)
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  React.useEffect(() => {
    // prefill options from catalog unitRanges when present
    if (catalog && (catalog as any).unitRanges && (catalog as any).unitRanges.length > 0) {
      const ur = (catalog as any).unitRanges as any[]
      setOptions(ur.map(u => ({ unitType: u.unitType, price: String(u.minPrice || ''), stockQuantity: '0' })))
      // set selling price to minimum if not already set
      if (!sellingPrice && ur.length > 0) setSellingPrice(String(ur[0].minPrice || ''))
    }
  }, [catalog])

  return (
    <div>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <label className="label">Wholesale price (min: {catalog.wholesaleMinPrice || catalog.minimumPrice}, max: {catalog.wholesaleMaxPrice || catalog.maximumPrice})</label>
          <input className="input" type="number" step="0.01" value={wholesalePrice} onChange={e => setWholesalePrice(e.target.value)} required />
        </div>
        <div className="form-row">
          <label className="label">Retail price (min: {catalog.retailMinPrice || 0}, max: {catalog.retailMaxPrice || 0})</label>
          <input className="input" type="number" step="0.01" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} required />
        </div>
        <div className="form-row">
          <label className="label">Options (units)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select id="unitTypeSelect">
              <option value="PIECE">Piece</option>
              <option value="BOX">Box</option>
              <option value="PACK">Pack</option>
            </select>
            <input id="unitPrice" className="input" type="number" step="0.01" placeholder="price" />
            <input id="unitStock" className="input" type="number" placeholder="stock" />
            <button type="button" className="btn" onClick={() => {
              const unitType = (document.getElementById('unitTypeSelect') as HTMLSelectElement).value
              const price = (document.getElementById('unitPrice') as HTMLInputElement).value
              const stock = (document.getElementById('unitStock') as HTMLInputElement).value
              if (!price) return
              // @ts-ignore — pre-existing React 19 useState typing issue
              setOptions((prev: any) => [...prev, { unitType, price, stockQuantity: stock || '0' }])
              ;(document.getElementById('unitPrice') as HTMLInputElement).value = ''
              ;(document.getElementById('unitStock') as HTMLInputElement).value = ''
            }}>Add Option</button>
          </div>
          <div style={{ marginTop: 8 }}>
            {options.map((o, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <div style={{ minWidth: 80 }}>{o.unitType}</div>
                <div style={{ minWidth: 80 }}>{o.price}</div>
                <div style={{ minWidth: 60 }}>{o.stockQuantity}</div>
                <button type="button" className="btn" onClick={() => { /* @ts-ignore */ setOptions(prev => prev.filter((_, i) => i !== idx)) }}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label className="label">Stock quantity</label>
          <input className="input" type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Product'}</button>
        </div>
      </form>

      {showSuccess && (
        <div className="modal-overlay">
          <div className="modal" style={{ minWidth: 260 }}>
            <h3>Product added</h3>
            <p>Your listing has been submitted and is pending approval.</p>
            <button type="button" className="btn btn-secondary" onClick={() => (window.location.href = '/provider/products')}>Go to listings</button>
          </div>
        </div>
      )}
    </div>
  )
}
