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

export default async function ClientsReportPage({ searchParams }: PageProps) {
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const params = await searchParams
  const period = (params?.period || 'current-month').toString()
  const from = (params?.from || '').toString()
  const to = (params?.to || '').toString()
  const clientId = (params?.clientId || '').toString()
  const q = (params?.q || '').toString().trim()
  const range = getReportDateRange({ period, from, to })

  const allClients = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const userFilter: any = {
    role: 'CUSTOMER',
    createdAt: { gte: range.start, lte: range.end },
  }

  if (q) {
    userFilter.OR = [
      { nameEN: { contains: q, mode: 'insensitive' } },
      { nameAR: { contains: q, mode: 'insensitive' } },
      { mobile: { contains: q, mode: 'insensitive' } },
    ]
  }

  const users = await prisma.user.findMany({
    where: userFilter,
    include: { wallet: true, customerOrders: { where: { createdAt: { gte: range.start, lte: range.end } } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const selectedClient = clientId
    ? await prisma.user.findFirst({
        where: { id: clientId, role: 'CUSTOMER' },
        include: {
          wallet: true,
          customerOrders: { where: { createdAt: { gte: range.start, lte: range.end } } },
        },
      })
    : null

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('clientsReport') || 'Clients report'}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('reportSubtitle') || 'Review customers created and active in the selected period.'}</p>
        </div>
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <input
            name="q"
            defaultValue={q}
            placeholder={tc('search') || 'Search clients'}
            className="input"
            style={{ minWidth: 220 }}
          />
          <select name="clientId" defaultValue={clientId} className="input">
            <option value="">{t('selectClient') || 'Select client'}</option>
            {allClients.map((user) => (
              <option key={user.id} value={user.id}>
                {user.nameEN || user.nameAR || user.mobile}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <div><strong>{t('totalCustomers') || 'Total customers'}</strong>: {users.length}</div>
            <div><strong>{t('totalOrders') || 'Orders'}</strong>: {users.reduce((sum, user) => sum + user.customerOrders.length, 0)}</div>
          </div>
          {selectedClient ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <Card>
                <h2 style={{ marginTop: 0 }}>{t('customerDetails') || 'Customer Details'}</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <div><strong>{t('customer') || 'Customer'}:</strong> {selectedClient.nameEN || selectedClient.nameAR || selectedClient.mobile}</div>
                    <div><strong>{t('mobile') || 'Mobile'}:</strong> {selectedClient.mobile}</div>
                    <div><strong>{t('status') || tc('status') || 'Status'}:</strong> {selectedClient.status || 'N/A'}</div>
                  </div>
                  <div>
                    <div><strong>{t('totalOrders') || 'Total Orders'}:</strong> {selectedClient.customerOrders.length}</div>
                    <div><strong>{t('totalSpent') || 'Total spent'}:</strong> {(selectedClient.customerOrders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0)).toFixed(2)} EGP</div>
                    <div><strong>{t('createdAt') || 'Created'}:</strong> {new Date(selectedClient.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 style={{ marginTop: 0 }}>{t('ordersReport') || 'Orders report'}</h2>
                <Table>
                  <thead>
                    <tr>
                      <th>{t('orderNumber') || 'Order'}</th>
                      <th>{t('date') || tc('date') || 'Date'}</th>
                      <th>{t('status') || tc('status') || 'Status'}</th>
                      <th>{t('total') || 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClient.customerOrders.map((order) => (
                      <tr key={order.id}>
                        <td><Link href={`/admin/orders/${order.id}`}>{order.orderNumber || order.id}</Link></td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>{order.status}</td>
                        <td>{Number(order.totalAmount || 0).toFixed(2)} EGP</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>
            </div>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>{t('customer') || 'Customer'}</th>
                  <th>{t('mobile') || 'Mobile'}</th>
                  <th>{t('orders') || 'Orders'}</th>
                  <th>{t('balance') || 'Balance'}</th>
                  <th>{t('createdAt') || 'Created'}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td><Link href={`/admin/accounts/customers/${user.id}`}>{user.nameEN || user.nameAR || user.mobile}</Link></td>
                    <td>{user.mobile}</td>
                    <td>{user.customerOrders.length}</td>
                    <td>{(user.wallet?.availableBalance || 0).toFixed(2)} EGP</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>
    </section>
  )
}
