import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import OrdersChart from '@/components/admin/OrdersChartClient'
import { getPendingAccountApprovalsCount } from '@/lib/actions/admin.actions'

export default async function AdminDashboardPage() {
  // fetch basic analytics
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)

  const [ordersToday, completedRevenueAgg, activeProviders, pendingAccountApprovals, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    prisma.providerProfile.count({ where: { isVisible: true } }),
    getPendingAccountApprovalsCount(),
    prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
  ])

  const revenue = (completedRevenueAgg._sum?.totalAmount) || 0

  // prepare chart data (last 7 days)
  const dayMap: Record<string, number> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    dayMap[key] = 0
  }
  recentOrders.forEach(o => {
    const key = o.createdAt.toISOString().slice(0, 10)
    if (dayMap[key] !== undefined) dayMap[key]++
  })
  const chartData = Object.keys(dayMap).map(k => ({ date: k.slice(5), orders: dayMap[k] }))

  return (
    <div>
      <section className="admin-dashboard container dashboard-shell" style={{ paddingTop: 16 }}>
        <div className="dashboard-hero">
          <div className="dashboard-hero-badge">Marketplace control center</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-6)', alignItems: 'center' }}>
            <div style={{ maxWidth: 640 }}>
              <h1 style={{ marginBottom: 'var(--space-3)' }}>Admin dashboard</h1>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.86)', fontSize: 'var(--text-md)' }}>Track growth, approvals, and orders in a premium commerce command view.</p>
            </div>
            <div className="dashboard-hero-actions">
              <Link href="/admin/approvals" className="btn btn-primary">Review approvals</Link>
              <Link href="/admin/orders" className="btn btn-ghost">Open orders</Link>
            </div>
          </div>
        </div>

        <div className="dashboard-grid dashboard-grid--4">
          <div className="dashboard-card dashboard-card--accent">
            <div className="dashboard-kpi">
              <span className="label">Total revenue</span>
              <span className="value">{revenue.toFixed(2)} EGP</span>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-kpi">
              <span className="label">Orders today</span>
              <span className="value">{ordersToday}</span>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="dashboard-kpi">
              <span className="label">Active providers</span>
              <span className="value">{activeProviders}</span>
            </div>
          </div>
          <Link href="/admin/approvals" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="dashboard-card" style={{ cursor: 'pointer' }}>
              <div className="dashboard-kpi">
                <span className="label">Pending approvals</span>
                <span className="value">{pendingAccountApprovals}</span>
              </div>
            </div>
          </Link>
        </div>

        <div className="dashboard-grid dashboard-grid--2">
          <div className="dashboard-card">
            <div className="dashboard-section-title">
              <div>
                <h3 style={{ margin: 0 }}>Orders (last 7 days)</h3>
                <p>Momentum across the marketplace.</p>
              </div>
            </div>
            <OrdersChart data={chartData} />
          </div>

          <div className="dashboard-card">
            <div className="dashboard-section-title">
              <div>
                <h3 style={{ margin: 0 }}>Quick actions</h3>
                <p>Jump into the most important workflows.</p>
              </div>
            </div>
            <div className="dashboard-list">
              <Link href="/admin/accounts/providers" className="dashboard-list-item"><strong>Manage providers</strong><span className="dashboard-pill">Go</span></Link>
              <Link href="/admin/catalog" className="dashboard-list-item"><strong>Manage catalog</strong><span className="dashboard-pill">Delete</span></Link>
              <Link href="/admin/approvals" className="dashboard-list-item"><strong>Review approvals</strong><span className="dashboard-pill">New</span></Link>
              <Link href="/admin/wallet" className="dashboard-list-item"><strong>Wallet overview</strong><span className="dashboard-pill">Finance</span></Link>
              <Link href="/admin/settings" className="dashboard-list-item"><strong>Platform settings</strong><span className="dashboard-pill">Config</span></Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
