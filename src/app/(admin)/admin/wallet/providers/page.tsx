import React from 'react'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import ProviderWalletManager from '@/components/admin/ProviderWalletManager'

export default async function ProviderWalletAdminPage() {
  const t = await getTranslations('admin')
  const providers = await prisma.user.findMany({
    where: { role: 'PROVIDER' },
    select: {
      id: true,
      nameEN: true,
      nameAR: true,
      mobile: true,
      wallet: {
        select: {
          id: true,
          userId: true,
          availableBalance: true,
          pendingBalance: true,
          isFrozen: true,
          transactions: {
            select: { id: true, amount: true, type: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="admin-wallet container">
      <h1>{t('providerWallets')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>{t('providerWalletsDescription')}</p>
      <ProviderWalletManager providers={providers.map((p) => ({ ...p, wallet: p.wallet as any }))} />
    </section>
  )
}
