"use client"

import React from 'react'
import { useTranslations } from 'next-intl'

export default function ProviderWalletPage() {
  const t = useTranslations('admin')

  return (
    <section className="provider-wallet container">
      <h1>{t('wallet') || 'Wallet'}</h1>
      <p>This is a placeholder for the Provider Wallet page. Implement wallet UI here.</p>
    </section>
  )
}
