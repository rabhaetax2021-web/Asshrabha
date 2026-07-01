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

export default async function ProductsReportPage({ searchParams }: PageProps) {
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const params = await searchParams
  const period = (params?.period || 'current-month').toString()
  const from = (params?.from || '').toString()
  const to = (params?.to || '').toString()
  const range = getReportDateRange({ period, from, to })

  const products = await prisma.providerProduct.findMany({
    where: {
      createdAt: { gte: range.start, lte: range.end },
    },
    include: {
      provider: true,
      catalogProduct: true,
      orderItems: { where: { order: { createdAt: { gte: range.start, lte: range.end } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('productsReport') || 'Products report'}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('reportSubtitle') || 'Review product listings and sales activity in the selected window.'}</p>
        </div>
        <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <select name="period" defaultValue={period} className="input">
            <option value="current-month">{t('periodCurrentMonth') || 'Current month'}</option>
            <option value="last-quarter">{t('periodLastQuarter') || 'Last quarter'}</option>
            <option value="last-month">{t('periodLastMonth') || 'Last month'}</option>
            <option value="this-year">{t('periodThisYear') || 'This year'}</option>
            <option value="last-year">{t('periodLastYear') || 'Last year'}</option>
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
              <th>{t('product') || 'Product'}</th>
              <th>{t('provider') || 'Provider'}</th>
              <th>{t('unitsSold') || 'Units sold'}</th>
              <th>{t('revenue') || 'Revenue'}</th>
              <th>{t('createdAt') || 'Created'}</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const sold = product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
              const revenue = product.orderItems.reduce((sum, item) => sum + item.totalPrice, 0)
              return (
                <tr key={product.id}>
                  <td>{product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || product.id}</td>
                  <td>{product.provider?.shopNameEN || product.provider?.shopNameAR || product.providerId}</td>
                  <td>{sold}</td>
                  <td>{revenue.toFixed(2)} EGP</td>
                  <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                </tr>
              )
            })}
          </tbody>
          </Table>
        </Card>
      </div>
    </section>
  )
}
