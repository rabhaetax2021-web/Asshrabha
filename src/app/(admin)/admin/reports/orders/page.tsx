import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { getReportDateRange } from '@/lib/reports/date-range'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import PrintReportButton from '@/components/admin/PrintReportButton'
import Link from 'next/link'

interface PageProps {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function OrdersReportPage({ searchParams }: PageProps) {
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const params = await searchParams
  const period = (params?.period || 'current-month').toString()
  const from = (params?.from || '').toString()
  const to = (params?.to || '').toString()
  const providerId = (params?.providerId || '').toString()
  const clientId = (params?.clientId || '').toString()
  const range = getReportDateRange({ period, from, to })

  const providers = await prisma.providerProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const clients = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const orderFilter: any = {
    createdAt: { gte: range.start, lte: range.end },
  }

  if (providerId) {
    orderFilter.providerId = providerId
  }

  if (clientId) {
    orderFilter.customerId = clientId
  }

  const orders = await prisma.order.findMany({
    where: orderFilter,
    include: { customer: true, provider: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('ordersReport') || 'Orders report'}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('reportSubtitle') || 'Review orders and revenue generated during the selected period.'}</p>
        </div>
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select name="providerId" defaultValue={providerId} className="input">
            <option value="">{t('selectProvider') || 'Select provider'}</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.shopNameEN || provider.shopNameAR || provider.user?.mobile}
              </option>
            ))}
          </select>
          <select name="clientId" defaultValue={clientId} className="input">
            <option value="">{t('selectClient') || 'Select client'}</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nameEN || client.nameAR || client.mobile}
              </option>
            ))}
          </select>
          <select name="period" defaultValue={period} className="input">
            <option value="current-month">{t('periodCurrentMonth') || 'Current month'}</option>
            <option value="last-quarter">{t('periodLastQuarter') || 'Last quarter'}</option>
            <option value="last-month">{t('periodLastMonth') || 'Last month'}</option>
            <option value="this-year">{t('periodThisYear') || 'This year'}</option>
            <option value="last-year">{t('periodLastYear') || 'Last year'}</option>
            <option value="all-time">{t('periodAllTime') || 'All time'}</option>
            <option value="custom">{t('periodCustom') || 'Custom range'}</option>
          </select>
          <input name="from" defaultValue={from} type="date" className="input" />
          <input name="to" defaultValue={to} type="date" className="input" />
          <button className="btn btn-primary" type="submit">{t('applyFilters') || 'Apply filters'}</button>
          <PrintReportButton label={t('print') || tc('print') || 'Print'} />
        </form>
      </div>

      <div className="report-printable">
        <Card>
          <Table>
          <thead>
            <tr>
              <th>{t('orderNumber') || 'Order'}</th>
              <th>{t('customer') || 'Customer'}</th>
              <th>{t('provider') || 'Provider'}</th>
              <th>{t('orderTotal') || 'Total'}</th>
              <th>{t('status') || tc('status') || 'Status'}</th>
              <th>{t('date') || tc('date') || 'Date'}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber}</Link></td>
                <td>{order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile}</td>
                <td>{order.provider?.shopNameEN || order.provider?.shopNameAR || order.providerId}</td>
                <td>{order.totalAmount.toFixed(2)} EGP</td>
                <td>{order.status}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
          </Table>
        </Card>
      </div>
    </section>
  )
}
