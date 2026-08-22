"use client"
import { useState } from 'react';
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function AdminDeleteButton({ userId, label = 'Delete' }: { userId: string | undefined; label?: string }) {
  const t = useTranslations('admin')
  const [loading, setLoading] = useState(false)
  if (!userId) return null

  async function handleDelete() {
    if (!confirm(t('deleteUserConfirmation'))) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/admins', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: userId }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast(t('deleted'), 'success')
      window.location.reload()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally { setLoading(false) }
  }

  return (
    <button className="btn btn-danger" disabled={loading} onClick={handleDelete}>{loading ? t('deleting') : label}</button>
  )
}
