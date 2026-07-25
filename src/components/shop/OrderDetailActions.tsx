"use client"

import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function OrderDetailActions({ orderId, orderNumber, canCancel }: {
  orderId: string
  orderNumber: string | number
  canCancel: boolean
}) {
  const t = useTranslations('shop')

  return (
    <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
      <Link href={`/shop/support?orderNumber=${encodeURIComponent(String(orderNumber))}`} className="btn btn-primary">
        {t('contactSupport') || 'Contact support'}
      </Link>
    </div>
  )
}
