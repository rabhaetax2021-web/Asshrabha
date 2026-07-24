import React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OrderDetailActions from '@/components/shop/OrderDetailActions'

export default async function ShopOrderDetailPage({ params }: { params: Promise<{ orderId: string }> | { orderId: string } }) {
  const t = await getTranslations('shop')
  const tc = await getTranslations('common')
  const current = await getCurrentUser()
  const resolvedParams = await params

  if (!current) {
    return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>{t('pleaseLogin') || 'Please login'}</div>
  }

  const order = await prisma.order.findFirst({
    where: { id: resolvedParams.orderId, customerId: current.id },
    include: {
      provider: { include: { user: { select: { nameEN: true, nameAR: true } } } },
      items: { include: { providerProduct: { include: { catalogProduct: { select: { nameEN: true, nameAR: true, images: true } } } } } },
      address: true,
    },
  })

  if (!order) {
    return <div className="container" style={{ padding: 'var(--space-8)' }}>
      <Link href="/shop/orders" className="btn btn-outline" style={{ marginBottom: 'var(--space-4)' }}>{tc('back')}</Link>
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>{t('orderNotFound') || 'Order not found'}</div>
    </div>
  }

  const subtotal = (order.items || []).reduce((sum: number, item: any) => sum + Number(item.totalPrice || 0), 0)
  const tax = Number(order.platformFee || 0)
  const totalAfterTax = subtotal + tax

  return (
    <section className="shop-order-detail container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('orderDetails')}</div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', margin: '2px 0 0' }}>{t('orderNumber', { number: order.orderNumber })}</h1>
        </div>
        <Link href="/shop/orders" className="btn btn-outline">{tc('back')}</Link>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>{order.provider?.shopNameEN || order.provider?.shopNameAR || t('store')}</div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <span className={`badge ${getStatusBadge(order.status)}`} style={{ textTransform: 'capitalize' }}>{getStatusLabel(order.status, t)}</span>
        </div>

        <div style={{ display: 'grid', gap: 'var(--space-3)', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('orderStatus')}</div>
            <div style={{ fontWeight: 'var(--font-semibold)' }}>{getStatusLabel(order.status, t)}</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{tc('total')}</div>
            <div style={{ fontWeight: 'var(--font-semibold)' }}>{Number(order.totalAmount || 0).toFixed(2)} EGP</div>
          </div>
          <div className="card" style={{ padding: 'var(--space-3)', background: 'var(--bg-secondary)' }}>
            <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginBottom: '4px' }}>{t('deliveryAddress') || tc('address')}</div>
            <div style={{ fontWeight: 'var(--font-semibold)' }}>{order.address?.addressLine || '—'}</div>
          </div>
        </div>

        <OrderDetailActions orderId={order.id} orderNumber={order.orderNumber} canCancel={canCancelOrder(order.status)} />
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)' }}>{t('orderSummary')}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {order.items.map((item: any) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'var(--font-semibold)' }}>{item.providerProduct?.catalogProduct?.nameEN || item.providerProduct?.catalogProduct?.nameAR || 'Product'}</div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{tc('quantity')}: {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 'var(--font-semibold)' }}>{Number(item.totalPrice || 0).toFixed(2)} EGP</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-light)', display: 'grid', gap: 'var(--space-2)', maxWidth: '320px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{tc('subtotal')}</span><strong>{subtotal.toFixed(2)} EGP</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t('deliveryFee') || tc('deliveryFee')}</span><strong>{tax.toFixed(2)} EGP</strong></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{tc('total')}</span><strong>{totalAfterTax.toFixed(2)} EGP</strong></div>
        </div>
      </div>

    </section>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'DELIVERED': return 'badge-success'
    case 'SHIPPED': return 'badge-info'
    case 'PENDING': return 'badge-warning'
    case 'CANCELLED': return 'badge-error'
    default: return 'badge-pending'
  }
}

function getStatusLabel(status: string, t: (key: string) => string) {
  switch (status) {
    case 'DELIVERED': return t('statusDelivered')
    case 'SHIPPED': return t('statusShipped')
    case 'PENDING': return t('statusPending')
    case 'CANCELLED': return t('statusCancelled')
    default: return t('statusProcessing')
  }
}

function canCancelOrder(status: string) {
  return status !== 'DELIVERED' && status !== 'COMPLETED' && status !== 'SHIPPED' && status !== 'CANCELLED'
}
