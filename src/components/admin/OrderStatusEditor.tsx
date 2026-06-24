"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OrderStatusEditor({ id, current }: { id: string; current: string }) {
  const [status, setStatus] = useState(current)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const update = async (s: string) => {
    if (!confirm(`Change status to ${s}?`)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status: s }) })
      const j = await res.json()
      if (!res.ok) return alert(j?.error || 'Failed to update')
      setStatus(s)
      router.refresh()
    } catch (e) {
      alert('Request failed')
    } finally { setLoading(false) }
  }

  const options = ['PENDING','CONFIRMED','SHIPPED','DELIVERED','COMPLETED','CANCELLED','REFUNDED']

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <select value={status} onChange={(e) => update(e.target.value)} disabled={loading}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {loading && <span>Saving…</span>}
    </div>
  )
}
