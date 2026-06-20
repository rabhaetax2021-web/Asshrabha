'use client'
import { useState } from 'react'
import { showToast } from '@/components/ui/toast'

export default function CloseTicketButton({ roomId, isClosed }: { roomId: string; isClosed: boolean }) {
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexShrink: 0 }}>
      <button
        className="btn btn-danger btn-sm"
        disabled={loading}
        onClick={async () => {
          if (!confirm('Are you sure you want to delete this ticket? This cannot be undone.')) return
          setLoading(true)
          try {
            const res = await fetch('/api/admin/support', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: roomId }) })
            if (!res.ok) throw new Error('Failed')
            showToast('Ticket deleted', 'success')
            window.location.href = '/admin/support'
          } catch (e: any) {
            showToast(e.message || 'Failed', 'error')
            setLoading(false)
          }
        }}
      >
        🗑️ Delete
      </button>
      <button
        className={`btn btn-sm ${isClosed ? 'btn-primary' : 'btn-secondary'}`}
        disabled={loading}
        onClick={async () => {
          setLoading(true)
          try {
            const res = await fetch('/api/admin/support', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: roomId, isClosed: !isClosed }) })
            if (!res.ok) throw new Error('Failed')
            showToast(isClosed ? 'Ticket reopened' : 'Ticket closed', 'success')
            window.location.reload()
          } catch (e: any) {
            showToast(e.message || 'Failed', 'error')
            setLoading(false)
          }
        }}
      >
        {isClosed ? '🔓 Reopen' : '🔒 Close'}
      </button>
    </div>
  )
}
