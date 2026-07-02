import React from 'react'
import { getFirstProvider, getOrderByIdForProvider } from '@/lib/actions/provider.actions'
import OrderDetailClient from '@/components/provider/OrderDetailClient'
import OrderStatusEditor from '@/components/provider/OrderStatusEditor'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params
  const provider = await getFirstProvider()
  if (!provider) return <div>Provider not found</div>

  const order = await getOrderByIdForProvider(provider.id, resolvedParams.id)
  if (!order) return <div>Order not found or not yours.</div>

  return (
    <section className="provider-order container">
      <h1>Order #{order.orderNumber}</h1>
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <div><strong>Status:</strong> {order.status}</div>
        <div><strong>Manage status:</strong> <OrderStatusEditor id={order.id} current={order.status} /></div>
        <div><strong>Customer:</strong> {order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile}</div>
        <div><strong>Mobile:</strong> {order.customer?.mobile || '—'}</div>
        <div><strong>Address:</strong> {order.address?.addressLine || '—'}</div>
        <div><strong>City:</strong> {order.address?.city || '—'}</div>
        <div><strong>Area:</strong> {order.address?.area || '—'}</div>
        <div><strong>Landmark:</strong> {order.address?.landmark || '—'}</div>
        <div><strong>Location URL:</strong> {order.address?.locationUrl ? <a href={order.address.locationUrl} target="_blank" rel="noreferrer">Open</a> : '—'}</div>
        <div><strong>Total:</strong> {order.totalAmount}</div>
      </div>

      {order.statusHistory?.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h2>Status history</h2>
          <ul>
            {order.statusHistory.map((entry: any) => (
              <li key={entry.id}>
                {entry.status} — {new Date(entry.createdAt).toLocaleString()}
                {entry.note ? ` (${entry.note})` : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      <OrderDetailClient order={order} />
    </section>
  )
}
