"use client"

import { FormEvent, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'

export default function AddListingForm({ catalog }: { catalog: any }) {
  const [price, setPrice] = useState(String(catalog.wholesaleMinPrice || catalog.wholesalePrice || catalog.retailMinPrice || ''))
  const [wholesaleUnit, setWholesaleUnit] = useState('BOX')
  const [stockQuantity, setStockQuantity] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const priceValue = Number(price)
      if (!priceValue || priceValue <= 0) {
        throw new Error('Price must be greater than 0')
      }

      const payload: any = { catalogProductId: catalog.id, sellingPrice: priceValue, wholesalePrice: priceValue, wholesaleUnit: String(wholesaleUnit), retailPrice: priceValue, stockQuantity: Number(stockQuantity) }

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
          <label className="label">Price</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="input" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
            <select value={wholesaleUnit} onChange={e => setWholesaleUnit(e.target.value)}>
              <option value="BOX">Box</option>
              <option value="PACK">Pack</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <label className="label">Stock status</label>
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
