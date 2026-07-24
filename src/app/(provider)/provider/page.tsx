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
    <section className="provider-dashboard container dashboard-shell">
      <div className="dashboard-hero">
        <div className="dashboard-hero-badge">Store performance</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-6)', alignItems: 'center' }}>
          <div style={{ maxWidth: 640 }}>
            <h1 style={{ marginBottom: 'var(--space-3)' }}>Provider dashboard</h1>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.86)', fontSize: 'var(--text-md)' }}>Stay on top of revenue, orders, and inventory with a retail-style command center.</p>
          </div>
          <div className="dashboard-hero-actions">
            <Link href="/provider/products" className="btn btn-primary">Manage products</Link>
            <Link href="/provider/orders" className="btn btn-ghost">View orders</Link>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--4">
        <div className="dashboard-card dashboard-card--accent">
          <div className="dashboard-kpi">
            <span className="label">Revenue</span>
            <span className="value">{dashboard.revenue.toFixed(2)} EGP</span>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-kpi">
            <span className="label">Pending orders</span>
            <span className="value">{dashboard.pendingOrders}</span>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-kpi">
            <span className="label">Low stock</span>
            <span className="value">{orders.filter((order) => order.status === 'PENDING').length}</span>
          </div>
        </div>
        <div className="dashboard-card">
          <div className="dashboard-kpi">
            <span className="label">Wallet</span>
            <span className="value">—</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid dashboard-grid--2">
        <div className="dashboard-card">
          <div className="dashboard-section-title">
            <div>
              <h3 style={{ margin: 0 }}>Recent orders</h3>
              <p>Your latest customer activity.</p>
            </div>
          </div>
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

        <div className="dashboard-card">
          <div className="dashboard-section-title">
            <div>
              <h3 style={{ margin: 0 }}>Quick actions</h3>
              <p>Keep your store moving fast.</p>
            </div>
          </div>
          <div className="dashboard-list">
            <Link href="/provider/store" className="dashboard-list-item"><strong>Store settings</strong><span className="dashboard-pill">Edit</span></Link>
            <Link href="/provider/products" className="dashboard-list-item"><strong>Products</strong><span className="dashboard-pill">Catalog</span></Link>
            <Link href="/provider/orders" className="dashboard-list-item"><strong>Order inbox</strong><span className="dashboard-pill">Live</span></Link>
            <Link href="/provider/notifications" className="dashboard-list-item"><strong>Notifications</strong><span className="dashboard-pill">Updates</span></Link>
          </div>
        </div>
      </div>
    </section>
  )
}
