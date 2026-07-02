"use client"

import { useRouter } from 'next/navigation'

export default function ProductActions({ id, reRegister = false }: { id: string; reRegister?: boolean }) {
  const router = useRouter()
  const del = async () => {
    if (!confirm('Delete this product?')) return
    try {
      const res = await fetch(`/api/provider/provider-products/${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) return alert(j?.error || 'failed')
      router.refresh()
    } catch (e) { alert('Request failed') }
  }

  const reRegisterProduct = async () => {
    try {
      const res = await fetch(`/api/provider/provider-products/${id}/re-register`, { method: 'POST' })
      const j = await res.json()
      if (!res.ok) return alert(j?.error || 'failed')
      router.refresh()
    } catch (e) { alert('Request failed') }
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <a href={`/provider/products/edit/${id}`} className="btn btn-outline">Edit</a>
      {reRegister && <button type="button" className="btn btn-primary" onClick={reRegisterProduct}>Re-register</button>}
      <button type="button" className="btn btn-danger" onClick={del}>Delete</button>
    </div>
  )
}
