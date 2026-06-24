"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function AdminEditActions({ editId, type, onDone }: { editId: string, type: 'provider' | 'customer', onDone?: () => void }) {
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState('')
  const router = useRouter()

  async function doAction(action: 'approve' | 'reject') {
    setLoading(true)
    try {
      const endpoint = type === 'provider' ? '/api/admin/provider-profile-edits' : '/api/admin/customer-profile-edits'
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, action, adminNote: note }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Updated', 'success')
      if (onDone) onDone()
      else router.refresh()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <input className="input" style={{ maxWidth: 180, fontSize: 'var(--text-sm)' }} placeholder="Admin note" value={note} onChange={e => setNote(e.target.value)} />
      <button className="btn btn-primary" onClick={() => doAction('approve')} disabled={loading}>Approve</button>
      <button className="btn btn-secondary" onClick={() => doAction('reject')} disabled={loading}>Reject</button>
    </div>
  )
}
