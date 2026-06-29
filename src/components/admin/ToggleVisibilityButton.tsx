"use client"
import { useState } from 'react';
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function ToggleVisibilityButton({ providerId, visible }: { providerId: string, visible: boolean }) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    const confirmMsg = visible ? 'Make provider invisible?' : 'Make provider visible?'
    if (!confirm(confirmMsg)) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_visibility', visible: !visible }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Request failed')
      showToast('Updated', 'success')
      window.location.reload()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" className={visible ? 'btn btn-ghost' : 'btn btn-primary'} disabled={loading} onClick={toggle}>
      {visible ? 'Hide' : 'Show'}
    </button>
  )
}
