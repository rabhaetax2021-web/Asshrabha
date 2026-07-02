import React from 'react'
import Link from 'next/link'
import { getFirstProvider, getOrdersByProvider, getProviderDashboardData } from '@/lib/actions/provider.actions'

export default async function ProviderDashboardPage() {
  const provider = await getFirstProvider()
  if (!provider) return <section className="provider-dashboard container"><h1>Provider Dashboard</h1><p>No provider found.</p></section>

  const [orders, dashboard] = await Promise.all([
    getOrdersByProvider(provider.id),
    getProviderDashboardData(provider.id),
  ])

  return (
    <section className="provider-dashboard container">
      <h1>Provider Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">Revenue<br/><strong>{dashboard.revenue.toFixed(2)} EGP</strong></div>
        <div className="kpi-card">Pending Orders<br/><strong>{dashboard.pendingOrders}</strong></div>
        <div className="kpi-card">Low Stock<br/><strong>{orders.filter((order) => order.status === 'PENDING').length}</strong></div>
        <div className="kpi-card">Wallet<br/><strong>—</strong></div>
      </div>

      <div className="recent-orders">
        <h2>Recent Orders</h2>
        {dashboard.recentOrders.length === 0 ? (
          <p>No orders yet.</p>
        ) : (
          <ul className="orders-list">
            {dashboard.recentOrders.map((order) => (
              <li key={order.id} className="order-card">
                <Link href={`/provider/orders/${order.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <div>#{order.orderNumber}</div>
                  <div>Total: {order.totalAmount} EGP</div>
                  <div>Status: {order.status}</div>
                  <div>Customer: {order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
