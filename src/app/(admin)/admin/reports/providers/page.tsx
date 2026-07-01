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

export default async function ProvidersReportPage({ searchParams }: PageProps) {
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const params = await searchParams
  const period = (params?.period || 'current-month').toString()
  const from = (params?.from || '').toString()
  const to = (params?.to || '').toString()
  const providerId = (params?.providerId || '').toString()
  const q = (params?.q || '').toString().trim()
  const range = getReportDateRange({ period, from, to })

  const providerFilter: any = {}
  if (q) {
    providerFilter.OR = [
      { shopNameEN: { contains: q, mode: 'insensitive' } },
      { shopNameAR: { contains: q, mode: 'insensitive' } },
      { user: { mobile: { contains: q, mode: 'insensitive' } } },
    ]
  }

  const providers = await prisma.providerProfile.findMany({
    where: providerFilter,
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  const selectedProvider = providerId ? await prisma.providerProfile.findUnique({
    where: { id: providerId },
    include: {
      user: true,
      products:
        period === 'all-time'
          ? {
              include: {
                catalogProduct: true,
                orderItems: true,
              },
            }
          : {
              where: { createdAt: { gte: range.start, lte: range.end } },
              include: {
                catalogProduct: true,
                orderItems: { where: { order: { createdAt: { gte: range.start, lte: range.end } } } },
              },
            },
      orders:
        period === 'all-time'
          ? { include: { customer: true } }
          : {
              where: { createdAt: { gte: range.start, lte: range.end } },
              include: { customer: true },
            },
    },
  }) : null

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('providersReport') || 'Providers report'}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
            {t('reportSubtitle') || 'Review providers, their products, and order activity during the selected period.'}
          </p>
        </div>

        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder={tc('search') || 'Search providers'}
            className="input"
            style={{ minWidth: 220 }}
          />

          <select name="providerId" defaultValue={providerId} className="input">
            <option value="">{t('selectProvider') || 'Select provider'}</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.shopNameEN || provider.shopNameAR || provider.user?.mobile}
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
          <button className="btn btn-primary" type="submit">
            {t('applyFilters') || 'Apply filters'}
          </button>
          <PrintReportButton label={t('print') || tc('print') || 'Print'} />
        </form>
      </div>

      <div className="report-printable">
        <div className="print-only-heading">
          <h1 style={{ margin: 0 }}>{t('providersReport') || 'Providers report'}</h1>
          {selectedProvider ? (
            <p style={{ margin: '4px 0 0' }}>{selectedProvider.shopNameEN || selectedProvider.shopNameAR}</p>
          ) : (
            <p style={{ margin: '4px 0 0' }}>{t('providersReport') || 'Providers report'}</p>
          )}
        </div>
        {selectedProvider ? (
          <div style={{ display: 'grid', gap: 16 }}>
            <Card>
              <h2 style={{ marginTop: 0 }}>{t('providerDetails') || 'Provider details'}</h2>
              {selectedProvider.logo ? (
                <div style={{ margin: '12px 0', textAlign: 'center' }}>
                  <img
                    src={selectedProvider.logo}
                    alt={selectedProvider.shopNameEN || selectedProvider.shopNameAR || 'Provider logo'}
                    style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>
              ) : null}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div>
                    <strong>{t('provider') || 'Provider'}:</strong>{' '}
                    {selectedProvider.shopNameEN || selectedProvider.shopNameAR}
                  </div>
                  <div>
                    <strong>{t('mobile') || 'Mobile'}:</strong>{' '}
                    {selectedProvider.user?.mobile}
                  </div>
                  <div>
                    <strong>{t('status') || tc('status') || 'Status'}:</strong>{' '}
                    {selectedProvider.isVisible ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                  </div>
                </div>
                <div>
                  <div>
                    <strong>{t('totalProducts') || 'Total products'}:</strong>{' '}
                    {selectedProvider.products?.length ?? 0}
                  </div>
                  <div>
                    <strong>{t('totalOrders') || 'Total orders'}:</strong>{' '}
                    {selectedProvider.orders?.length ?? 0}
                  </div>
                  <div>
                    <strong>{t('createdAt') || 'Created'}:</strong>{' '}
                    {new Date(selectedProvider.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>{t('productsReport') || 'Products report'}</h2>
              <Table>
                <thead>
                  <tr>
                    <th>{t('product') || 'Product'}</th>
                    <th>{t('orderTotal') || 'Total sold'}</th>
                    <th>{t('revenue') || 'Revenue'}</th>
                    <th>{t('createdAt') || 'Created'}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProvider.products?.map((product: any) => {
                    const sold = (product.orderItems ?? []).reduce((sum: number, item: any) => sum + (item.quantity ?? 0), 0)
                    const revenue = (product.orderItems ?? []).reduce((sum: number, item: any) => sum + (item.totalPrice ?? 0), 0)
                    return (
                      <tr key={product.id}>
                        <td>{product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || product.catalogProductId}</td>
                        <td>{sold}</td>
                        <td>{revenue.toFixed(2)} EGP</td>
                        <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card>

            <Card>
              <h2 style={{ marginTop: 0 }}>{t('ordersReport') || 'Orders report'}</h2>
              <Table>
                <thead>
                  <tr>
                    <th>{t('orderNumber') || 'Order'}</th>
                    <th>{t('customer') || 'Customer'}</th>
                    <th>{t('orderTotal') || 'Total'}</th>
                    <th>{t('status') || tc('status') || 'Status'}</th>
                    <th>{t('date') || tc('date') || 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProvider.orders?.map((order: any) => (
                    <tr key={order.id}>
                      <td>{order.orderNumber}</td>
                      <td>{order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile}</td>
                      <td>{Number(order.totalAmount).toFixed(2)} EGP</td>
                      <td>{order.status}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </div>
        ) : (
          <Card>
            <Table>
              <thead>
                <tr>
                  <th>{t('provider') || 'Provider'}</th>
                  <th>{t('mobile') || 'Mobile'}</th>
                  <th>{t('createdAt') || 'Created'}</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((provider: any) => (
                  <tr key={provider.id}>
                    <td>
                      <Link href={`/admin/accounts/providers/${provider.id}`}>
                        {provider.shopNameEN || provider.shopNameAR || provider.user?.mobile}
                      </Link>
                    </td>
                    <td>{provider.user?.mobile}</td>
                    <td>{new Date(provider.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card>
        )}
      </div>
    </section>
  )
}
