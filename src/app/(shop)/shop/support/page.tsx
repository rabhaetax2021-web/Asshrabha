"use client"

import React from 'react'
import { useTranslations } from 'next-intl'
import SupportChat from '@/components/shop/SupportChat'

export default function SupportPage() {
  const t = useTranslations('shop')

  return (
    <section className="support container">
      <h1>{t('support')}</h1>
      <SupportChat />
    </section>
  )
}
