"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'

export default function OrderDetailActions({ orderId, orderNumber, canCancel }: {
  orderId: string
  orderNumber: string | number
  canCancel: boolean
}) {
  const router = useRouter()
  const t = useTranslations('shop')
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!canCancel) return
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to cancel order')
      showToast(t('orderCancelled') || 'Order cancelled', 'success')
      router.refresh()
    } catch (e: any) {
      showToast(e?.message || 'Failed to cancel order', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      {canCancel && (
        <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={loading}>
          {loading ? '…' : t('cancelOrder') || 'Cancel order'}
        </button>
      )}
      <Link href={`/shop/support?orderNumber=${encodeURIComponent(String(orderNumber))}`} className="btn btn-primary">
        {t('contactSupport') || 'Contact support'}
      </Link>
    </div>
  )
}
