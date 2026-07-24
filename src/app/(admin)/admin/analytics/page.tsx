import React from 'react'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import OrdersChart from '@/components/admin/OrdersChartClient'

export default async function AdminAnalyticsPage() {
  const days = 14
  const since = new Date()
  since.setDate(since.getDate() - (days - 1))
  since.setHours(0, 0, 0, 0)

  const recent = await prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } })

  const map: Record<string, number> = {}
  for (let i = 0; i < days; i++) {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    map[d.toISOString().slice(0, 10)] = 0
  }
  recent.forEach(o => { const k = o.createdAt.toISOString().slice(0, 10); if (map[k] !== undefined) map[k]++ })
  const data = Object.keys(map).map(k => ({ date: k.slice(5), orders: map[k] }))

  return (
    <section className="admin-analytics container">
      <h1 style={{ marginBottom: 12 }}>Analytics</h1>
      <Card>
        <h3 style={{ marginTop: 0 }}>Orders (last 14 days)</h3>
        <OrdersChart data={data} />
      </Card>
    </section>
  )
}
