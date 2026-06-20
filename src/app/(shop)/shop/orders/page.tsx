import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ShopOrdersPage() {
  const current = await getCurrentUser()
  if (!current) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Please login</div>

  const orders = await prisma.order.findMany({
    where: { customerId: current.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      provider: { include: { user: { select: { nameEN: true, nameAR: true } } } },
      items: { include: { providerProduct: { include: { catalogProduct: { select: { nameEN: true, nameAR: true, images: true } } } } } },
    },
  })

  return (
    <section className="shop-orders container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
        My Orders
      </h1>

      {orders.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📦</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>No orders yet</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Your order history will appear here.</p>
          <Link href="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      )}

      <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {orders.map(o => (
          <div key={o.id} className="order-card card" style={{ padding: 'var(--space-4)' }}>
            <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)', paddingBottom: 'var(--space-3)', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>#{o.orderNumber}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-2xs)', marginTop: '2px' }}>
                  {new Date(o.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              <span className={`badge ${getStatusBadge(o.status)}`} style={{ fontSize: 'var(--text-xs)', textTransform: 'capitalize' }}>
                {o.status.toLowerCase()}
              </span>
            </div>

            {/* Store */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: 'var(--radius-md)',
                background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', fontWeight: 'var(--font-bold)', color: 'white'
              }}>
                {(o.provider?.shopNameEN || o.provider?.shopNameAR || 'S').charAt(0).toUpperCase()}
              </div>
              <Link href={`/shop/store/${o.provider?.id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)', textDecoration: 'none' }}>
                {o.provider?.shopNameEN || o.provider?.shopNameAR || 'Store'}
              </Link>
            </div>

            {/* Items preview */}
            {o.items.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                {o.items.slice(0, 3).map((item) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {item.providerProduct?.catalogProduct?.images?.[0] ? (
                      <img
                        src={item.providerProduct.catalogProduct.images[0]}
                        alt=""
                        style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xs)' }}>
                        📦
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.providerProduct?.catalogProduct?.nameEN || item.providerProduct?.catalogProduct?.nameAR || 'Product'}
                      </div>
                      <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                        Qty: {item.quantity} × {item.unitPrice.toFixed(2)} EGP
                      </div>
                    </div>
                  </div>
                ))}
                {o.items.length > 3 && (
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', paddingLeft: '44px' }}>
                    +{o.items.length - 3} more items
                  </div>
                )}
              </div>
            )}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Total</span>
              <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>{o.totalAmount.toFixed(2)} EGP</span>
            </div>
          </div>
        ))}
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
