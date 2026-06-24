"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function OrderRowActions({ id }: { id: string }) {
  const router = useRouter()
  const setStatus = async (status: string) => {
    if (!confirm(`Change order ${id} status to ${status}?`)) return
    try {
      const res = await fetch(`/api/admin/orders/${id}/status`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }) })
      const j = await res.json()
      if (!res.ok) return alert(j?.error || 'failed')
      router.refresh()
    } catch (e) {
      alert('Request failed')
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <a href={`/admin/orders/${id}`} className="btn">View</a>
      <button type="button" onClick={() => setStatus('CONFIRMED')} className="btn">Mark Confirmed</button>
      <button type="button" onClick={() => setStatus('CANCELLED')} className="btn btn-danger">Cancel</button>
    </div>
  )
}
