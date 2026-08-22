import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import CustomerActions from '@/components/admin/CustomerActions'

type Props = { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const t = await getTranslations('admin')
  const locale = await getLocale()
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return <div>{t('forbidden')}</div>

  const { id } = await params
  const customer = await prisma.user.findFirst({
    where: { id, role: 'CUSTOMER' },
    select: {
      id: true,
      nameAR: true,
      nameEN: true,
      mobile: true,
      email: true,
      avatar: true,
      customerType: true,
      status: true,
      locale: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      wallet: {
        select: {
          availableBalance: true,
          pendingBalance: true,
          totalPaid: true,
          isFrozen: true,
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { id: true, amount: true, type: true, status: true, note: true, createdAt: true },
          },
        },
      },
      addresses: { orderBy: { createdAt: 'desc' } },
      customerOrders: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, orderNumber: true, totalAmount: true, status: true, paymentMethod: true, customerNote: true, createdAt: true },
      },
      _count: { select: { customerOrders: true, reviews: true, addresses: true } },
    },
  })

  if (!customer) return <div className="container">{t('customerNotFound')}</div>

  const displayName = customer.nameEN || customer.nameAR || customer.mobile

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/accounts/customers" className="btn btn-ghost">{t('backToCustomers')}</Link>
          <h1 style={{ marginTop: 16, marginBottom: 4 }}>{displayName}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{customer.mobile}</p>
        </div>
        <CustomerActions userId={customer.id} status={customer.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        <InfoCard title={t('profile')}>
          <DetailRow label={t('nameEnglish')} value={customer.nameEN || '—'} />
          <DetailRow label={t('nameArabic')} value={customer.nameAR || '—'} />
          <DetailRow label={t('mobile')} value={customer.mobile} />
          <DetailRow label={t('email')} value={customer.email || '—'} />
          <DetailRow label={t('customerType')} value={customer.customerType} />
          <DetailRow label={t('status')} value={customer.status} />
          <DetailRow label={t('language')} value={customer.locale} />
        </InfoCard>

        <InfoCard title={t('account')}>
          <DetailRow label={t('created')} value={formatDate(customer.createdAt, locale)} />
          <DetailRow label={t('updated')} value={formatDate(customer.updatedAt, locale)} />
          <DetailRow label={t('lastLogin')} value={customer.lastLoginAt ? formatDate(customer.lastLoginAt, locale) : '—'} />
          <DetailRow label={t('orders')} value={String(customer._count.customerOrders)} />
          <DetailRow label={t('reviews')} value={String(customer._count.reviews)} />
          <DetailRow label={t('addresses')} value={String(customer._count.addresses)} />
        </InfoCard>

        <InfoCard title={t('uploadedPhotos')}>
          {customer.avatar ? (
            <img src={customer.avatar} alt={`${displayName} avatar`} style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, background: 'var(--bg-secondary)' }} />
          ) : <p style={{ color: 'var(--text-muted)' }}>{t('noUploadedPhotos')}</p>}
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <InfoCard title={t('wallet')}>
          <DetailRow label={t('available')} value={`${(customer.wallet?.availableBalance || 0).toFixed(2)} EGP`} />
          <DetailRow label={t('pending')} value={`${(customer.wallet?.pendingBalance || 0).toFixed(2)} EGP`} />
          <DetailRow label={t('totalPaid')} value={`${(customer.wallet?.totalPaid || 0).toFixed(2)} EGP`} />
          <DetailRow label={t('frozen')} value={customer.wallet?.isFrozen ? t('yes') : t('no')} />
          <h4 style={{ margin: '20px 0 8px' }}>{t('recentTransactions')}</h4>
          {customer.wallet?.transactions.length ? customer.wallet.transactions.map((transaction) => (
            <DetailRow key={transaction.id} label={`${transaction.type} (${transaction.status})`} value={`${transaction.amount.toFixed(2)} EGP`} />
          )) : <p style={{ color: 'var(--text-muted)' }}>{t('noTransactions')}</p>}
        </InfoCard>

        <InfoCard title={t('savedAddresses')}>
          {customer.addresses.length ? customer.addresses.map((address) => (
            <div key={address.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <strong>{address.label}{address.isDefault ? ` (${t('default')})` : ''}</strong>
              <div>{address.fullName} · {address.mobile}</div>
              <div>{address.addressLine}, {address.city}{address.area ? `, ${address.area}` : ''}</div>
              {address.landmark && <div>{t('landmark')}: {address.landmark}</div>}
              {address.locationUrl && <a href={address.locationUrl} target="_blank" rel="noreferrer">{t('openLocation')}</a>}
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>{t('noSavedAddresses')}</p>}
        </InfoCard>

        <InfoCard title={t('orders')}>
          {customer.customerOrders.length ? customer.customerOrders.map((order) => (
            <div key={order.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <Link href={`/admin/orders/${order.id}`}><strong>{order.orderNumber}</strong></Link>
              <div>{order.totalAmount.toFixed(2)} EGP · {order.status} · {order.paymentMethod}</div>
              <div style={{ color: 'var(--text-muted)' }}>{formatDate(order.createdAt, locale)}</div>
              {order.customerNote && <div>{t('note')}: {order.customerNote}</div>}
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>{t('noOrders')}</p>}
        </InfoCard>
      </div>
    </section>
  )
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="card" style={{ padding: 20 }}><h2 style={{ fontSize: 'var(--text-lg)', marginTop: 0 }}>{title}</h2>{children}</div>
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}><span style={{ color: 'var(--text-muted)' }}>{label}</span><strong style={{ textAlign: 'right', wordBreak: 'break-word' }}>{value}</strong></div>
}

function formatDate(value: Date, locale: string) {
  return new Date(value).toLocaleString(locale === 'ar' ? 'ar-EG' : 'en-GB')
}