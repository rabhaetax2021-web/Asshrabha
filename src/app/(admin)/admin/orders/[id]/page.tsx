import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import OrderManagementPanel from '@/components/orders/OrderManagementPanel'
import PrintReportButton from '@/components/admin/PrintReportButton'

type Props = { params: Promise<{ id: string }> | { id: string } }

export default async function OrderDetailPage({ params }: Props) {
  const resolvedParams = await params
  const t = await getTranslations('admin')
  const tc = await getTranslations('common')
  const order = await prisma.order.findUnique({
    where: { id: resolvedParams.id },
    include: {
      items: { include: { providerProduct: { include: { catalogProduct: true } } } },
      customer: true,
      provider: { include: { user: true } },
      address: true,
    },
  })
  if (!order) return <section className="admin-orders container"><div className="card glass"><p>{t('orderNotFound') || 'Order not found.'}</p></div></section>

  const subtotal = (order.items || []).reduce((sum: number, item: any) => sum + Number(item.totalPrice || 0), 0)
  const tax = Number(order.platformFee || 0)
  const totalAfterTax = subtotal + tax

  return (
    <section className="admin-orders container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>{t('orderDetailsTitle') || 'Order details'} #{order.orderNumber}</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>{t('placedOn') || 'Placed on'} {new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <PrintReportButton label={t('printOrder') || 'Print paper'} className="btn btn-outline" />
          <Link href="/admin/orders" className="btn btn-outline">{tc('back')}</Link>
        </div>
      </div>

      <div className="report-printable order-print-sheet" style={{ marginBottom: 16 }}>
        <div className="card glass" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0 }}>{t('orderDetailsTitle') || 'Order details'}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>#{order.orderNumber}</p>
            </div>
            <div className="badge">{order.status}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
            <div><strong>{t('clientDetails') || 'Client details'}</strong></div>
            <div><strong>{t('customerName') || 'Name'}:</strong> {order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile || '—'}</div>
            <div><strong>{t('customerMobile') || 'Mobile'}:</strong> {order.customer?.mobile || '—'}</div>
            <div><strong>{t('providerMobile') || 'Provider mobile'}:</strong> {order.provider?.user?.mobile || '—'}</div>
            <div><strong>{t('area') || 'Area'}:</strong> {order.address?.area || '—'}</div>
            <div><strong>{t('address') || 'Address'}:</strong> {order.address?.addressLine || '—'}</div>
            <div><strong>{t('locationUrl') || 'Location URL'}:</strong> {order.address?.locationUrl || '—'}</div>
          </div>
          <div className="ui-table-wrap" style={{ marginTop: 16 }}>
            <table className="ui-table">
              <thead><tr><th>#</th><th>{t('productName') || 'Product'}</th><th>{tc('price') || 'Price'}</th><th>{tc('quantity') || 'Quantity'}</th><th>{tc('total') || 'Total'}</th></tr></thead>
              <tbody>
                {(order.items || []).map((item: any, index: number) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.providerProduct?.catalogProduct?.nameEN || item.providerProduct?.catalogProduct?.nameAR || 'Product'}</td>
                    <td>{Number(item.unitPrice || 0).toFixed(2)} EGP</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.totalPrice || 0).toFixed(2)} EGP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 16, display: 'grid', gap: 8, maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('subtotal') || tc('subtotal')}</span><strong>{subtotal.toFixed(2)} EGP</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('tax') || 'Tax'}</span><strong>{tax.toFixed(2)} EGP</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('totalAfterTax') || 'Total after tax'}</span><strong>{totalAfterTax.toFixed(2)} EGP</strong></div>
          </div>
        </div>
      </div>

      <div className="card glass" style={{ padding: 16, marginBottom: 16 }}>
        <div className="kpi-grid" style={{ marginBottom: 0 }}>
          <div className="kpi-card"><div style={{ color: 'var(--text-muted)' }}>{t('status') || tc('status')}</div><strong>{order.status}</strong></div>
          <div className="kpi-card"><div style={{ color: 'var(--text-muted)' }}>{tc('total') || 'Total'}</div><strong>{Number(order.totalAmount || 0).toFixed(2)} EGP</strong></div>
          <div className="kpi-card"><div style={{ color: 'var(--text-muted)' }}>{t('provider') || 'Provider'}</div><strong>{order.provider?.shopNameEN || order.provider?.shopNameAR || order.providerId}</strong></div>
          <div className="kpi-card"><div style={{ color: 'var(--text-muted)' }}>{t('customer') || 'Customer'}</div><strong>{order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile || '—'}</strong></div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        <section className="card glass" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('clientDetails') || 'Client details'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div><strong>{t('customerName') || 'Name'}:</strong> {order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile || '—'}</div>
            <div><strong>{t('customerMobile') || 'Mobile'}:</strong> {order.customer?.mobile || '—'}</div>
            <div><strong>{t('providerMobile') || 'Provider mobile'}:</strong> {order.provider?.user?.mobile || '—'}</div>
            <div><strong>{t('area') || 'Area'}:</strong> {order.address?.area || '—'}</div>
            <div><strong>{t('address') || 'Address'}:</strong> {order.address?.addressLine || '—'}</div>
            <div><strong>{t('locationUrl') || 'Location URL'}:</strong> {order.address?.locationUrl ? <a href={order.address.locationUrl} target="_blank" rel="noreferrer">{t('open') || 'Open'}</a> : '—'}</div>
          </div>
        </section>

        <section className="card glass" style={{ padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t('orderSummary') || 'Order summary'}</h3>
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('productName') || 'Name'}</th>
                  <th>{tc('price') || 'Price'}</th>
                  <th>{tc('quantity') || 'Amount'}</th>
                  <th>{tc('total') || 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item: any, index: number) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>{item.providerProduct?.catalogProduct?.nameEN || item.providerProduct?.catalogProduct?.nameAR || 'Product'}</td>
                    <td>{Number(item.unitPrice || 0).toFixed(2)} EGP</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.totalPrice || 0).toFixed(2)} EGP</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, display: 'grid', gap: 8, maxWidth: 320 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('subtotal') || tc('subtotal')}</span><strong>{subtotal.toFixed(2)} EGP</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('tax') || 'Tax'}</span><strong>{tax.toFixed(2)} EGP</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('totalAfterTax') || 'Total after tax'}</span><strong>{totalAfterTax.toFixed(2)} EGP</strong></div>
          </div>
        </section>

        <OrderManagementPanel order={order} isAdmin />
      </div>
    </section>
  )
}
