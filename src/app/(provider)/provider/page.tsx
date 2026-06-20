import React from 'react'

export default function ProviderDashboardPage() {
  return (
    <section className="provider-dashboard container">
      <h1>Provider Dashboard</h1>
      <div className="kpi-grid">
        <div className="kpi-card">Revenue<br/><strong>—</strong></div>
        <div className="kpi-card">Pending Orders<br/><strong>—</strong></div>
        <div className="kpi-card">Low Stock<br/><strong>—</strong></div>
        <div className="kpi-card">Wallet<br/><strong>—</strong></div>
      </div>

      <div className="recent-orders">
        <h2>Recent Orders</h2>
        <p>No orders yet.</p>
      </div>
    </section>
  )
}
