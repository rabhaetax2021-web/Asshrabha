"use client"

import React, { useState, useEffect } from 'react'
import { showToast } from '@/components/ui/toast'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'

interface Address {
  id: string
  label: string
  fullName: string
  mobile: string
  addressLine: string
  city: string
  area: string | null
  landmark: string | null
  isDefault: boolean
}

interface CheckoutClientProps {
  addresses: Address[]
  userId: string
}

export default function CheckoutClient({ addresses, userId }: CheckoutClientProps) {
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s: any) => s.items)
  const clear = useCartStore((s: any) => s.clear)
  const [loading, setLoading] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const defaultAddr = addresses.find(a => a.isDefault)
    return defaultAddr?.id || addresses[0]?.id || ''
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const total = items.reduce((sum: number, i: any) => sum + (i.price || 0) * i.quantity, 0)

  async function place() {
    if (items.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }
    if (!selectedAddressId) {
      showToast('Please select a delivery address', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/shop/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i: any) => ({
            providerProductId: i.providerProductId,
            quantity: i.quantity,
            optionId: i.optionId,
          })),
          addressId: selectedAddressId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to place order')
      showToast('Order placed successfully!', 'success')
      clear()
      window.location.href = '/shop/orders'
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally { setLoading(false) }
  }

  if (!mounted) {
    return (
      <section className="checkout container">
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>Checkout</h1>
        <div className="card" style={{ opacity: 0.6, padding: 'var(--space-8)', textAlign: 'center' }}>
          <p>Loading checkout...</p>
        </div>
      </section>
    )
  }

  return (
    <section className="checkout container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
        Checkout
      </h1>

      {items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🛒</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>Your cart is empty</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>Add some items before checking out.</p>
          <Link href="/shop" className="btn btn-primary">Start Shopping</Link>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Order Summary */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              📦 Order Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {items.map((i: any) => (
                <div key={i.providerProductId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-medium)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {i.title || i.providerProductId}
                    </div>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                      Qty: {i.quantity} × {i.price || 0} EGP
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {((i.price || 0) * i.quantity).toFixed(2)} EGP
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--border-color)' }}>
              <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>Total</span>
              <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>{total.toFixed(2)} EGP</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              🏠 Delivery Address
            </h3>
            {addresses.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>No saved addresses.</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>Contact support to add an address.</p>
              </div>
            )}
            {addresses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)',
                      padding: 'var(--space-3)',
                      borderRadius: 'var(--radius-md)',
                      border: selectedAddressId === addr.id ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                      background: selectedAddressId === addr.id ? 'var(--primary-50)' : 'var(--bg-secondary)',
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast) ease',
                    }}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                      style={{ marginTop: '2px', accentColor: 'var(--primary)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{addr.label}</span>
                        {addr.isDefault && <span className="badge badge-success" style={{ fontSize: 'var(--text-2xs)' }}>Default</span>}
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{addr.fullName} · {addr.mobile}</p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {addr.addressLine}, {addr.city}{addr.area ? `, ${addr.area}` : ''}
                        {addr.landmark && <span> · Landmark: {addr.landmark}</span>}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Place Order Button */}
          <button
            disabled={loading || items.length === 0 || !selectedAddressId}
            onClick={place}
            className="btn btn-primary"
            style={{
              width: '100%', padding: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)',
              borderRadius: 'var(--radius-xl)', marginTop: 'var(--space-2)',
              opacity: loading || !selectedAddressId ? 0.6 : 1,
              cursor: loading || !selectedAddressId ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                Placing Order...
              </span>
            ) : (
              `Place Order · ${total.toFixed(2)} EGP`
            )}
          </button>

          {!selectedAddressId && addresses.length > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--warning-dark)', fontSize: 'var(--text-sm)' }}>
              ⚠️ Please select a delivery address
            </p>
          )}
        </div>
      )}
    </section>
  )
}
