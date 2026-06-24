"use client"
import React from 'react'
import { getErrorMessage } from '@/lib/errors'

export default function AddListingForm({ catalog }: { catalog: any }) {
  const [sellingPrice, setSellingPrice] = React.useState(String(catalog.minimumPrice || ''))
  const [wholesalePrice, setWholesalePrice] = React.useState(String(catalog.wholesaleMinPrice || catalog.minimumPrice || ''))
  const [retailPrice, setRetailPrice] = React.useState(String(catalog.retailMinPrice || 0))
  const [wholesaleUnit, setWholesaleUnit] = React.useState('BOX')
  const [stockQuantity, setStockQuantity] = React.useState('0')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [showSuccess, setShowSuccess] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const wPrice = Number(wholesalePrice || sellingPrice)
      const rPrice = Number(retailPrice || 0)
      const wMin = Number(catalog.wholesaleMinPrice || 0)
      const wMax = Number(catalog.wholesaleMaxPrice || 0)
      const rMin = Number(catalog.retailMinPrice || 0)
      const rMax = Number(catalog.retailMaxPrice || 0)
      if (wMax > 0 && (wPrice < wMin || wPrice > wMax)) {
        throw new Error(`Wholesale price must be between ${wMin.toFixed(2)} and ${wMax.toFixed(2)}`)
      }
      if (rMax > 0 && (rPrice < rMin || rPrice > rMax)) {
        throw new Error(`Retail price must be between ${rMin.toFixed(2)} and ${rMax.toFixed(2)}`)
      }

      const payload: any = { catalogProductId: catalog.id, sellingPrice: Number(sellingPrice), wholesalePrice: wPrice, wholesaleUnit: String(wholesaleUnit), retailPrice: rPrice, stockQuantity: Number(stockQuantity) }

      const res = await fetch('/api/provider/provider-products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setShowSuccess(true)
      setTimeout(() => {
        window.location.href = '/provider/products'
      }, 1600)
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-row">
          <label className="label">Wholesale price (allowed {catalog.wholesaleMinPrice || 0} - {catalog.wholesaleMaxPrice || 0})</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input" type="number" step="0.01" value={wholesalePrice} onChange={e => setWholesalePrice(e.target.value)} required />
            <select value={wholesaleUnit} onChange={e => setWholesaleUnit(e.target.value)}>
              <option value="BOX">Box</option>
              <option value="PACK">Pack</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <label className="label">Retail price (allowed {catalog.retailMinPrice || 0} - {catalog.retailMaxPrice || 0})</label>
          <input className="input" type="number" step="0.01" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} required />
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
