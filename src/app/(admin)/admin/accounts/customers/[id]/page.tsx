import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import CustomerActions from '@/components/admin/CustomerActions'

type Props = { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return <div>Forbidden</div>

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

  if (!customer) return <div className="container">Customer not found</div>

  const displayName = customer.nameEN || customer.nameAR || customer.mobile

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/accounts/customers" className="btn btn-ghost">Back to customers</Link>
          <h1 style={{ marginTop: 16, marginBottom: 4 }}>{displayName}</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>{customer.mobile}</p>
        </div>
        <CustomerActions userId={customer.id} status={customer.status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 16 }}>
        <InfoCard title="Profile">
          <DetailRow label="Name (English)" value={customer.nameEN || '—'} />
          <DetailRow label="Name (Arabic)" value={customer.nameAR || '—'} />
          <DetailRow label="Mobile" value={customer.mobile} />
          <DetailRow label="Email" value={customer.email || '—'} />
          <DetailRow label="Customer type" value={customer.customerType} />
          <DetailRow label="Status" value={customer.status} />
          <DetailRow label="Language" value={customer.locale} />
        </InfoCard>

        <InfoCard title="Account">
          <DetailRow label="Created" value={formatDate(customer.createdAt)} />
          <DetailRow label="Updated" value={formatDate(customer.updatedAt)} />
          <DetailRow label="Last login" value={customer.lastLoginAt ? formatDate(customer.lastLoginAt) : '—'} />
          <DetailRow label="Orders" value={String(customer._count.customerOrders)} />
          <DetailRow label="Reviews" value={String(customer._count.reviews)} />
          <DetailRow label="Addresses" value={String(customer._count.addresses)} />
        </InfoCard>

        <InfoCard title="Uploaded photos">
          {customer.avatar ? (
            <img src={customer.avatar} alt={`${displayName} avatar`} style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 8, background: 'var(--bg-secondary)' }} />
          ) : <p style={{ color: 'var(--text-muted)' }}>No uploaded photos.</p>}
        </InfoCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <InfoCard title="Wallet">
          <DetailRow label="Available" value={`${(customer.wallet?.availableBalance || 0).toFixed(2)} EGP`} />
          <DetailRow label="Pending" value={`${(customer.wallet?.pendingBalance || 0).toFixed(2)} EGP`} />
          <DetailRow label="Total paid" value={`${(customer.wallet?.totalPaid || 0).toFixed(2)} EGP`} />
          <DetailRow label="Frozen" value={customer.wallet?.isFrozen ? 'Yes' : 'No'} />
          <h4 style={{ margin: '20px 0 8px' }}>Recent transactions</h4>
          {customer.wallet?.transactions.length ? customer.wallet.transactions.map((transaction) => (
            <DetailRow key={transaction.id} label={`${transaction.type} (${transaction.status})`} value={`${transaction.amount.toFixed(2)} EGP`} />
          )) : <p style={{ color: 'var(--text-muted)' }}>No transactions.</p>}
        </InfoCard>

        <InfoCard title="Saved addresses">
          {customer.addresses.length ? customer.addresses.map((address) => (
            <div key={address.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <strong>{address.label}{address.isDefault ? ' (Default)' : ''}</strong>
              <div>{address.fullName} · {address.mobile}</div>
              <div>{address.addressLine}, {address.city}{address.area ? `, ${address.area}` : ''}</div>
              {address.landmark && <div>Landmark: {address.landmark}</div>}
              {address.locationUrl && <a href={address.locationUrl} target="_blank" rel="noreferrer">Open location</a>}
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>No saved addresses.</p>}
        </InfoCard>

        <InfoCard title="Orders">
          {customer.customerOrders.length ? customer.customerOrders.map((order) => (
            <div key={order.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
              <Link href={`/admin/orders/${order.id}`}><strong>{order.orderNumber}</strong></Link>
              <div>{order.totalAmount.toFixed(2)} EGP · {order.status} · {order.paymentMethod}</div>
              <div style={{ color: 'var(--text-muted)' }}>{formatDate(order.createdAt)}</div>
              {order.customerNote && <div>Note: {order.customerNote}</div>}
            </div>
          )) : <p style={{ color: 'var(--text-muted)' }}>No orders.</p>}
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

function formatDate(value: Date) {
  return new Date(value).toLocaleString('en-GB')
}