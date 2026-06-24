import React from 'react'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import OrderStatusEditor from '@/components/admin/OrderStatusEditor'
import Link from 'next/link'

type Props = { params: { id: string } }

export default async function OrderDetailPage({ params }: Props) {
  const id = params.id
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { providerProduct: { include: { catalogProduct: true } } } },
      customer: true,
      provider: true,
    },
  })
  if (!order) return <div className="container"><Card><p>Order not found.</p></Card></div>

  return (
    <section className="admin-order-detail container">
      <h1>Order {order.orderNumber}</h1>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
          <div>
            <h3>Items</h3>
            <div className="ui-table-wrap">
              <table className="ui-table">
                <thead>
                  <tr><th style={{ textAlign: 'left', padding: 8 }}>Product</th><th style={{ padding: 8 }}>Qty</th><th style={{ padding: 8 }}>Price</th></tr>
                </thead>
                <tbody>
                  {order.items.map(it => (
                    <tr key={it.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                      <td style={{ padding: 8 }}>{it.providerProduct?.catalogProduct?.nameEN || it.providerProduct?.catalogProduct?.nameAR || it.providerProductId}</td>
                      <td style={{ padding: 8 }}>{it.quantity}</td>
                      <td style={{ padding: 8 }}>{(it.unitPrice || it.totalPrice || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}>Total: <strong>{order.totalAmount.toFixed(2)} EGP</strong></div>
          </div>

          <aside>
            <h3>Overview</h3>
            <div><strong>Customer:</strong> {order.customer?.nameEN || order.customer?.nameAR || order.customerId}</div>
            <div><strong>Provider:</strong> {order.provider?.shopNameEN || order.provider?.shopNameAR || order.providerId}</div>
            <div><strong>Created:</strong> {new Date(order.createdAt).toLocaleString()}</div>
            <div style={{ marginTop: 12 }}><strong>Status:</strong> <OrderStatusEditor id={order.id} current={order.status} /></div>
            <div style={{ marginTop: 12 }}><Link href="/admin/orders">Back to orders</Link></div>
          </aside>
        </div>
      </Card>
    </section>
  )
}
