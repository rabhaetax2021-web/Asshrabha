"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function AdminDeleteButton({ userId, label = 'Delete' }: { userId: string | undefined; label?: string }) {
  const [loading, setLoading] = useState(false)
  if (!userId) return null

  async function handleDelete() {
    if (!confirm('Delete this user and all related data?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Deleted', 'success')
      window.location.reload()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally { setLoading(false) }
  }

  return (
    <button className="btn btn-danger" disabled={loading} onClick={handleDelete}>{loading ? 'Deleting...' : label}</button>
  )
}
