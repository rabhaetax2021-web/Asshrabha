"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditProductForm({ initial }: { initial: any }) {
  const router = useRouter()
  const [sellingPrice, setSellingPrice] = useState(String(initial.sellingPrice || ''))
  const [wholesalePrice, setWholesalePrice] = useState(String(initial.wholesalePrice || ''))
  const [retailPrice, setRetailPrice] = useState(String(initial.retailPrice || ''))
  const [stockQuantity, setStockQuantity] = useState(String(initial.stockQuantity || '0'))
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { sellingPrice: Number(sellingPrice), wholesalePrice: Number(wholesalePrice), retailPrice: Number(retailPrice), stockQuantity: Number(stockQuantity) }
      const res = await fetch(`/api/provider/provider-products/${initial.id}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      const updated = j.updated
      if (updated && updated.status === 'PENDING_APPROVAL') {
        alert('Your price change was submitted and is pending admin approval.')
        router.push('/provider/products')
        return
      }
      router.push('/provider/products')
    } catch (e) {
      alert('Failed to save')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="admin-form">
      <div className="form-row">
        <label className="label">Wholesale Price</label>
        <input className="input" type="number" step="0.01" value={wholesalePrice} onChange={e => setWholesalePrice(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Selling Price</label>
        <input className="input" type="number" step="0.01" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Retail Price</label>
        <input className="input" type="number" step="0.01" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Stock Quantity</label>
        <input className="input" type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
      </div>
      {(
        Number(sellingPrice) !== Number(initial.sellingPrice || 0) ||
        Number(wholesalePrice) !== Number(initial.wholesalePrice || 0) ||
        Number(retailPrice) !== Number(initial.retailPrice || 0)
      ) && (
        <div style={{ marginBottom: 12, color: 'var(--text-warning)' }}>
          Changing prices will submit the new prices for admin approval and may temporarily hide the listing.
        </div>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  )
}
