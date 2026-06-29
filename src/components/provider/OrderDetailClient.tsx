"use client"
import React, { useState } from 'react'

export default function OrderDetailClient({ order }: { order: any }) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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
      setMessage('Request submitted')
    } catch (err: any) {
      setMessage(err?.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="order-detail-client">
      {message && <div className="notice">{message}</div>}
      <ul>
        {order.items.map((it: any) => (
          <li key={it.id} className="order-item">
            <div>{it.providerProduct?.catalogProduct?.nameEN || it.providerProduct?.catalogProduct?.nameAR}</div>
            <div>Qty: {it.quantity}</div>
            <div>Unit: {it.unitPrice}</div>
            <div>
              <button className="btn btn-outline" onClick={() => submitAction('MARK_UNAVAILABLE', it.id)} disabled={loading}>Mark Unavailable</button>
              <button className="btn btn-outline" onClick={() => {
                const q = Math.max(1, it.quantity - 1)
                submitAction('REDUCE_QUANTITY', it.id, q)
              }} disabled={loading}>Reduce by 1</button>
              <button className="btn btn-danger" onClick={() => submitAction('REMOVE_PRODUCT', it.id)} disabled={loading}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
