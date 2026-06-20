import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <section className="admin-orders container">
      <h1>Orders</h1>
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Provider</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.id}>
              <td>{o.orderNumber}</td>
              <td>{o.customerId}</td>
              <td>{o.providerId}</td>
              <td>{o.totalAmount}</td>
              <td>{o.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
