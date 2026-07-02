"use client"
import React, { useState } from 'react'
import { getDeliveryLocationDetails } from '@/lib/provider/order-location'

function getInitialQuantity(item: any) {
  return typeof item?.quantity === 'number' ? item.quantity : 0
}

export default function OrderDetailClient({ order }: { order: any }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState(order?.items || [])
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null)
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, number>>({})
  const locationDetails = getDeliveryLocationDetails(order?.address)

  async function submitAction(action: string, itemId: string, quantity?: number) {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/provider/orders/${order.id}/modify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, orderItemId: itemId, newQuantity: quantity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      if (action === 'REDUCE_QUANTITY' && typeof quantity === 'number') {
        setItems((prev: any[]) => prev.map((it) => it.id === itemId ? { ...it, quantity, totalPrice: (it.unitPrice || 0) * quantity } : it))
        setEditingQuantityId(null)
      }
      if (action === 'REMOVE_PRODUCT') {
        setItems((prev: any[]) => prev.map((it) => it.id === itemId ? { ...it, quantity: 0, totalPrice: 0 } : it))
      }
      setMessage('Updated successfully')
    } catch (err: any) {
      setMessage(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="order-detail-client">
      {message && <div className="notice">{message}</div>}
      <div style={{ display: 'grid', gap: 10, marginBottom: 16, padding: '12px 14px', border: '1px solid var(--border-light)', borderRadius: 12, background: 'var(--bg-secondary)' }}>
        <div style={{ fontWeight: 600 }}>Delivery details</div>
        <div>
          <strong>Address:</strong>{' '}
          {locationDetails.displayAddress ? locationDetails.displayAddress : 'No delivery address provided'}
        </div>
        <div>
          <strong>Location:</strong>{' '}
          {locationDetails.mapsUrl ? (
            <a href={locationDetails.mapsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
              Open in Maps
            </a>
          ) : 'No shared location'}
        </div>
      </div>
      <ul>
        {items.map((it: any) => {
          const currentQty = getInitialQuantity(it)
          const isRemoved = currentQty === 0
          return (
            <li key={it.id} className="order-item" style={{ opacity: isRemoved ? 0.6 : 1 }}>
              <div>{it.providerProduct?.catalogProduct?.nameEN || it.providerProduct?.catalogProduct?.nameAR}</div>
              <div>Qty: {isRemoved ? 'Removed' : it.quantity}</div>
              <div>Unit: {it.unitPrice}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button className="btn btn-outline" onClick={() => submitAction('MARK_UNAVAILABLE', it.id)} disabled={loading || isRemoved}>Mark Unavailable</button>
                <button className="btn btn-outline" onClick={() => {
                  const q = Math.max(1, currentQty - 1)
                  submitAction('REDUCE_QUANTITY', it.id, q)
                }} disabled={loading || isRemoved}>Reduce by 1</button>
                <button className="btn btn-outline" onClick={() => {
                  const next = window.prompt('Enter new quantity', String(currentQty || 1))
                  if (next === null) return
                  const parsed = Number(next)
                  if (!Number.isInteger(parsed) || parsed <= 0 || parsed >= currentQty) {
                    setMessage('Quantity must be between 1 and current quantity')
                    return
                  }
                  submitAction('REDUCE_QUANTITY', it.id, parsed)
                }} disabled={loading || isRemoved}>Set Quantity</button>
                <button className="btn btn-danger" onClick={() => submitAction('REMOVE_PRODUCT', it.id)} disabled={loading || isRemoved}>Remove</button>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
