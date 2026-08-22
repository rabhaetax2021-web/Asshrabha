import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/utils/permissions'
import AddCustomerWallet from '@/components/admin/AddCustomerWallet'

export default async function AddCustomerWalletPage() {
  const current = await getCurrentUser()
  if (!current || !hasPermission(current.role as any, current.permissions as any, 'MANAGE_WALLETS')) {
    return <div className="container">Forbidden</div>
  }

  const t = await getTranslations('admin')
  return (
    <section className="admin-page container">
      <h1>{t('addCustomerWallet')}</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>{t('addCustomerWalletDescription')}</p>
      <AddCustomerWallet />
    </section>
  )
}