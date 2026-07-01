"use client"
import { useState } from 'react';
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'

export default function RequestsList({ initial, type }: { initial: any[]; type: 'deposit' | 'withdraw' }) {
  const t = useTranslations('admin')
  const [items, setItems] = useState(initial || [])
  const [processing, setProcessing] = useState<string | null>(null)

  async function doAction(id: string, action: 'approve' | 'reject') {
    if (!confirm(t('approve') === action ? 'Are you sure?' : 'Are you sure?')) return
    setProcessing(id)
    try {
      const url = `/api/admin/wallet/${type === 'deposit' ? 'deposit-requests' : 'withdraw-requests'}/${id}/${action}`
      const body = action === 'reject' ? JSON.stringify({ note: 'Rejected by admin' }) : undefined
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || t('failed'))
      setItems(items.map(it => it.id === id ? { ...it, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : it))
      showToast(action === 'approve' ? t('approved') : t('rejected'), 'success')
    } catch (e: any) { showToast(e?.message || String(e), 'error') }
    finally { setProcessing(null) }
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      {items.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>{t('noRequests')}</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map(it => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderRadius: 6, background: 'var(--bg-secondary)' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{it.wallet?.user?.nameEN || it.wallet?.user?.mobile}</div>
                <div style={{ color: 'var(--text-muted)' }}>{it.amount} EGP • {it.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {it.status === 'PENDING' && (
                  <>
                    <button className="btn btn-primary" onClick={() => doAction(it.id, 'approve')} disabled={processing === it.id}>{processing === it.id ? '...' : t('approve')}</button>
                    <button className="btn btn-ghost" onClick={() => doAction(it.id, 'reject')} disabled={processing === it.id}>{processing === it.id ? '...' : t('reject')}</button>
                  </>
                )}
                {it.adminNote && <div style={{ color: 'var(--text-muted)' }}>{it.adminNote}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
