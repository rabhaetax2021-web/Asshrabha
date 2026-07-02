import React from 'react'
import { getFirstProvider, getOrderByIdForProvider } from '@/lib/actions/provider.actions'
import OrderDetailClient from '@/components/provider/OrderDetailClient'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const provider = await getFirstProvider()
  if (!provider) return <div>Provider not found</div>

  const order = await getOrderByIdForProvider(provider.id, params.id)
  if (!order) return <div>Order not found or not yours.</div>

  return (
    <section className="provider-order container">
      <h1>Order #{order.orderNumber}</h1>
      <div>Status: {order.status}</div>
      <div>Customer: {order.customer?.nameEN || order.customer?.nameAR || order.customer?.mobile}</div>
      <div>Total: {order.totalAmount}</div>
      <OrderDetailClient order={order} />
    </section>
  )
}
