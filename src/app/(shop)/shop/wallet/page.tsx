import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTranslations } from 'next-intl/server'
import WalletClient from '@/components/shop/WalletClient'
import { getOrCreateWallet } from '@/lib/actions/wallet.actions'

export default async function WalletPage() {
  const current = await getCurrentUser()
  const t = await getTranslations('shop')
  if (!current) return <div>{t('pleaseLogin')}</div>
  const wallet = await getOrCreateWallet(current.id)

  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="wallet container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>{t('walletTitle')}</h1>
      <WalletClient wallet={wallet} transactions={transactions} />
    </section>
  )
}
