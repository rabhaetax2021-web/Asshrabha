import React from 'react'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import OrdersChart from '@/components/admin/OrdersChart'

export default async function AdminDashboardPage() {
  // fetch basic analytics
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const since = new Date()
  since.setDate(since.getDate() - 6)
  since.setHours(0, 0, 0, 0)

  const [ordersToday, completedRevenueAgg, activeProviders, pendingApprovals, recentOrders] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.aggregate({ where: { status: 'COMPLETED' }, _sum: { totalAmount: true } }),
    prisma.providerProfile.count({ where: { isVisible: true } }),
    prisma.providerProduct.count({ where: { status: 'PENDING_APPROVAL' } }),
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
      <section className="admin-dashboard container" style={{ paddingTop: 16 }}>
        <div className="dashboard-tiles">
          <Card style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Total Revenue</div>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{revenue.toFixed(2)} EGP</div>
              </div>
              <div>
                <Button variant="ghost">Export</Button>
              </div>
            </div>
          </Card>
          <Card style={{ width: 220 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Orders Today</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{ordersToday}</div>
          </Card>
          <Card style={{ width: 220 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Active Providers</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{activeProviders}</div>
          </Card>
          <Card style={{ width: 220 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Pending Approvals</div>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700 }}>{pendingApprovals}</div>
          </Card>
        </div>

        <Card>
          <h3 style={{ marginTop: 0 }}>Orders (last 7 days)</h3>
          <OrdersChart data={chartData} />
        </Card>

        <div style={{ marginTop: 20 }}>
          <Card>
            <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
            <p style={{ color: 'var(--text-muted)' }}>Activity feed and logs will appear here.</p>
          </Card>
        </div>
      </section>
    </div>
  )
}
