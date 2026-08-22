import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import CustomerWalletManager from '@/components/admin/CustomerWalletManager'

export default async function AdminWalletPage() {
  const t = await getTranslations('admin')
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    select: {
      id: true,
      nameEN: true,
      nameAR: true,
      mobile: true,
      wallet: {
        select: {
          availableBalance: true,
          pendingBalance: true,
          transactions: {
            select: { id: true, amount: true, type: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <section className="admin-wallet container">
      <h1>{t('clientWallets')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>{t('clientWalletsDescription')}</p>
      <CustomerWalletManager customers={customers as any} />
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <ul style={{ display: 'grid', gap: 'var(--space-3)', paddingLeft: 20 }}>
          <li><Link href="/admin/wallet/deposit-requests">{t('depositRequests')}</Link></li>
          <li><Link href="/admin/wallet/withdraw-requests">{t('withdrawRequests')}</Link></li>
          <li><Link href="/admin/wallet/history">{t('history')}</Link></li>
          <li><Link href="/admin/wallet/payment-methods">{t('paymentMethods')}</Link></li>
        </ul>
      </div>
    </section>
  )
}
