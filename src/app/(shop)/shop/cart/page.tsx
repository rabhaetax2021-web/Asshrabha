"use client"

import React, { useEffect, useState } from 'react'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'

export default function CartPage() {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s: any) => s.items)
  const remove = useCartStore((s: any) => s.removeItem)
  const total = items.reduce((sum: number, i: any) => sum + (i.price || 0) * i.quantity, 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch by rendering a consistent skeleton until mounted
  if (!mounted) {
    return (
      <section className="cart-page container">
        <h1>Your Cart</h1>
        <div className="cart-empty card" style={{ opacity: 0.6 }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🛒</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>Loading cart...</h3>
        </div>
      </section>
    )
  }

  return (
    <section className="cart-page container">
      <h1>Your Cart</h1>

      {items.length === 0 && (
        <div className="cart-empty card">
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🛒</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>Your cart is empty</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Browse our stores and add some products!</p>
          <Link href="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="cart-list">
          {items.map((i: any) => (
            <div key={i.providerProductId} className="cart-item card">
              <div className="cart-item-info">
                <div className="cart-item-title">{i.title || i.providerProductId}</div>
                <div className="cart-item-meta">Qty: {i.quantity} × {i.price || 0} EGP</div>
              </div>
              <div className="cart-item-price">{((i.price || 0) * i.quantity).toFixed(2)} EGP</div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i.providerProductId)}>Remove</button>
            </div>
          ))}

          <div className="cart-summary card">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span className="price">{total.toFixed(2)} EGP</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span className="muted">Calculated at checkout</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total</span>
              <span className="price">{total.toFixed(2)} EGP</span>
            </div>
            <form action="/shop/checkout" method="get" style={{ marginTop: 'var(--space-4)' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Proceed to Checkout</button>
            </form>
          </div>
        </div>
      )}
    </section>
  )
}
