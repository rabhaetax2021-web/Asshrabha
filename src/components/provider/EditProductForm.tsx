"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation'

export default function EditProductForm({ initial }: { initial: any }) {
  const router = useRouter()
  const [wholesalePrice, setWholesalePrice] = useState(String(initial.wholesalePrice || ''))
  const [retailPrice, setRetailPrice] = useState(String(initial.retailPrice || ''))
  const [stockQuantity, setStockQuantity] = useState(String(initial.stockQuantity || '0'))
  const [loading, setLoading] = useState(false)

  const wholesaleMin = Number(initial.wholesaleMinPrice || 0)
  const wholesaleMax = Number(initial.wholesaleMaxPrice || 0)
  const retailMin = Number(initial.retailMinPrice || 0)
  const retailMax = Number(initial.retailMaxPrice || 0)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Client-side validation: enforce catalog price ranges when provided
      const w = Number(wholesalePrice)
      const r = Number(retailPrice)
      if (wholesaleMax > 0 && (w < wholesaleMin || w > wholesaleMax)) {
        alert(`Wholesale price must be between ${wholesaleMin} and ${wholesaleMax}`)
        setLoading(false)
        return
      }
      if (retailMax > 0 && (r < retailMin || r > retailMax)) {
        alert(`Retail price must be between ${retailMin} and ${retailMax}`)
        setLoading(false)
        return
      }

      const payload = { wholesalePrice: w, retailPrice: r, stockQuantity: Number(stockQuantity) }
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
        {wholesaleMax > 0 && (
          <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Allowed wholesale: {wholesaleMin} - {wholesaleMax}
          </div>
        )}
      </div>
      <div className="form-row">
        <label className="label">Retail Price</label>
        <input className="input" type="number" step="0.01" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} />
        {retailMax > 0 && (
          <div style={{ marginTop: 6, color: 'var(--text-muted)' }}>
            Allowed retail: {retailMin} - {retailMax}
          </div>
        )}
      </div>
      <div className="form-row">
        <label className="label">Stock Quantity</label>
        <input className="input" type="number" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} />
      </div>
      {(
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
