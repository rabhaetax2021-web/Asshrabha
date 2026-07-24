"use client"

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import SupportChat from '@/components/shop/SupportChat'

export default function SupportPage() {
  const t = useTranslations('shop')
  const searchParams = useSearchParams()
  const initialOrderNumber = searchParams.get('orderNumber')

  return (
    <section className="support container">
      <h1>{t('support')}</h1>
      <SupportChat initialOrderNumber={initialOrderNumber || undefined} />
    </section>
  )
}
