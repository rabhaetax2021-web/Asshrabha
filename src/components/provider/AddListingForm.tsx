"use client"

import { FormEvent, useState } from 'react'
import { getErrorMessage } from '@/lib/errors'

export default function AddListingForm({ catalog }: { catalog: any }) {
  const [wholesalePrice, setWholesalePrice] = useState(String(catalog.wholesaleMinPrice || catalog.wholesalePrice || ''))
  const [retailPrice, setRetailPrice] = useState(String(catalog.retailMinPrice || catalog.retailPrice || ''))
  const [stockQuantity, setStockQuantity] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const wholesaleValue = Number(wholesalePrice)
      const retailValue = Number(retailPrice)
      if (!wholesaleValue || wholesaleValue <= 0) {
        throw new Error('Wholesale price must be greater than 0')
      }
      if (!retailValue || retailValue <= 0) {
        throw new Error('Retail price must be greater than 0')
      }

      const payload: any = {
        catalogProductId: catalog.id,
        sellingPrice: retailValue,
        wholesalePrice: wholesaleValue,
        retailPrice: retailValue,
        stockQuantity: Number(stockQuantity),
      }

      const res = await fetch('/api/provider/provider-products', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          <label className="label">Wholesale Price</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={wholesalePrice}
            onChange={e => setWholesalePrice(e.target.value)}
            required
          />
          {catalog.wholesaleMaxPrice > 0 && (
            <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
              Allowed wholesale: {catalog.wholesaleMinPrice} - {catalog.wholesaleMaxPrice}
            </div>
          )}
        </div>

        <div className="form-row">
          <label className="label">Retail Price</label>
          <input
            className="input"
            type="number"
            step="0.01"
            value={retailPrice}
            onChange={e => setRetailPrice(e.target.value)}
            required
          />
          {catalog.retailMaxPrice > 0 && (
            <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
              Allowed retail: {catalog.retailMinPrice} - {catalog.retailMaxPrice}
            </div>
          )}
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
