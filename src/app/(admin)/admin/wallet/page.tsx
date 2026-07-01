import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function AdminWalletPage() {
  const t = await getTranslations('admin')

  return (
    <section className="admin-wallet container">
      <h1>{t('clientWallets')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>{t('clientWalletsDescription')}</p>
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
