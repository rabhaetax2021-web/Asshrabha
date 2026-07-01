import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import WalletClient from '@/components/shop/WalletClient'

export default async function ProviderWalletPage() {
  const current = await getCurrentUser()
  if (!current) return <div>Please login</div>

  let wallet = await prisma.wallet.findFirst({ where: { userId: current.id } })
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId: current.id,
        availableBalance: 0,
        pendingBalance: 0,
        totalPaid: 0,
      },
    })
  }

  const transactions = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="provider-wallet container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>Wallet</h1>
      <WalletClient wallet={wallet} transactions={transactions} />
    </section>
  )
}
