import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { filterAndSortOrders } from '@/lib/orders/order-helpers'

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const params = await searchParams
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      customer: true,
      provider: { include: { user: true } },
      items: { include: { providerProduct: { include: { catalogProduct: true } } } },
    },
  })

  const q = (params?.q || '').toString().trim()
  const status = (params?.status || '').toString().trim().toUpperCase()
  const sortBy = (params?.sortBy || 'createdAt').toString()
  const sortDir = (params?.sortDir || 'desc').toString() as 'asc' | 'desc'
  const visibleOrders = filterAndSortOrders(orders, { search: q, status, sortBy: sortBy as any, sortDir })

  return (
    <section className="admin-orders container">
      <div className="card glass" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0 }}>{t('orderManagement') || 'Order management'}</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('manageAllOrders') || 'Search and manage all provider orders across the marketplace.'}</p>
          </div>
          <div className="badge">{visibleOrders.length} {t('orders') || tc('orders')}</div>
        </div>

        <form method="get" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 16 }}>
          <input name="q" defaultValue={q} className="input" placeholder={t('searchPlaceholder') || 'Search by provider, client, product or order number'} />
          <select name="status" defaultValue={status} className="input">
            <option value="">{t('statusFilter') || 'All statuses'}</option>
            <option value="PENDING">PENDING</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="SHIPPED">SHIPPED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="REFUNDED">REFUNDED</option>
          </select>
          <select name="sortBy" defaultValue={sortBy} className="input">
            <option value="createdAt">{t('sortNewest') || 'Newest first'}</option>
            <option value="totalAmount">{t('sortHighest') || 'Highest total'}</option>
            <option value="status">{t('sortStatus') || 'Status'}</option>
          </select>
          <select name="sortDir" defaultValue={sortDir} className="input">
            <option value="desc">{t('sortDesc') || 'Descending'}</option>
            <option value="asc">{t('sortAsc') || 'Ascending'}</option>
          </select>
          <button type="submit" className="btn btn-primary">{tc('filter') || t('filter')}</button>
        </form>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="card glass"><p>{t('noOrdersFound') || 'No orders matched the current filters.'}</p></div>
      ) : (
        <div className="orders-list">
          {visibleOrders.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} className="order-card card-interactive" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>#{order.orderNumber}</div>
                <div className="badge">{order.status}</div>
              </div>
              <div>{t('provider') || 'Provider'}: {order.provider?.shopNameEN || order.provider?.shopNameAR || order.provider?.user?.mobile || order.providerId}</div>
              <div>{t('customer') || 'Customer'}: {order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile || order.customerId}</div>
              <div>{t('mobile') || 'Mobile'}: {order.provider?.user?.mobile || order.customer?.mobile || '—'}</div>
              <div>{tc('total') || 'Total'}: {Number(order.totalAmount || 0).toFixed(2)} EGP</div>
              <div>{tc('date') || 'Date'}: {new Date(order.createdAt).toLocaleString()}</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
