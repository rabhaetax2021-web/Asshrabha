import React from 'react'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import OrderRowActions from '@/components/admin/OrderRowActions'
import Link from 'next/link'

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: { customer: true, provider: true } })

  return (
    <section className="admin-orders container">
      <h1>Orders</h1>
      <Card>
        <Table>
          <thead>
            <tr>
              <th style={{ padding: 12 }}>Order</th>
              <th style={{ padding: 12 }}>Customer</th>
              <th style={{ padding: 12 }}>Provider</th>
              <th style={{ padding: 12 }}>Total</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={{ padding: 12 }}><Link href={`/admin/orders/${o.id}`}>{o.orderNumber}</Link></td>
                <td style={{ padding: 12 }}>{o.customer?.nameEN || o.customer?.nameAR || o.customerId}</td>
                <td style={{ padding: 12 }}>{o.provider?.shopNameEN || o.provider?.shopNameAR || o.providerId}</td>
                <td style={{ padding: 12 }}>{o.totalAmount.toFixed(2)} EGP</td>
                <td style={{ padding: 12 }}>{o.status}</td>
                <td style={{ padding: 12 }}><OrderRowActions id={o.id} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </section>
  )
}
