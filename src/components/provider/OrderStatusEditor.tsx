"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const OPTIONS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED']

export default function OrderStatusEditor({ id, current }: { id: string; current: string }) {
  const [status, setStatus] = useState(current)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const update = async (nextStatus: string) => {
    if (!confirm(`Change status to ${nextStatus}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/provider/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update')
      setStatus(nextStatus)
      router.refresh()
    } catch (err: any) {
      alert(err?.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select value={status} onChange={(e) => update(e.target.value)} disabled={loading}>
        {OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {loading && <span>Saving…</span>}
    </div>
  )
}
