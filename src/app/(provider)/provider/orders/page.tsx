import React from 'react'
import { getFirstProvider, getOrdersByProvider } from '@/lib/actions/provider.actions'

export default async function ProviderOrdersPage() {
  const provider = await getFirstProvider()
  if (!provider) return <div>No provider found.</div>

  const orders = await getOrdersByProvider(provider.id)

  return (
    <section className="provider-orders container">
      <h1>Orders</h1>
      {orders.length === 0 && <p>No orders yet.</p>}
      <ul className="orders-list">
        {orders.map(o => (
          <li key={o.id} className="order-card">
            <div>#{o.orderNumber}</div>
            <div>Total: {o.totalAmount}</div>
            <div>Status: {o.status}</div>
            <div>Customer: {o.customer?.nameEN || o.customer?.nameAR || o.customer?.mobile}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}
