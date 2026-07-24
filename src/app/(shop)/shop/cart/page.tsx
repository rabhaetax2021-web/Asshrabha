"use client"

import React, { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'
import { buildCheckoutTotals } from '@/lib/order-pricing'

type CartItem = { providerProductId: string; title?: string; quantity: number; price?: number }

export default function CartPage() {
  const t = useTranslations('shop')
  const tc = useTranslations('common')
  const [mounted, setMounted] = useState(false)
  const items = useCartStore((s: { items: CartItem[] }) => s.items)
  const remove = useCartStore((s: { removeItem: (id: string, optionId?: string) => void }) => s.removeItem)
  const updateQuantity = useCartStore((s: { updateQuantity: (id: string, optionId: string | undefined, quantity: number) => void }) => s.updateQuantity)
  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await fetch('/api/auth/session').then(r => r.json()).catch(() => ({}))
        const buyerIsShop = !!s?.user && (s.user.role === 'PROVIDER' || s.user.customerType === 'SHOP')
        const map: Record<string, number> = {}
        await Promise.all(items.map(async (it: any) => {
          if (it.price && Number(it.price) > 0) return
          try {
            const res = await fetch(`/api/provider/provider-product?id=${encodeURIComponent(it.providerProductId)}`)
            if (!res.ok) return
            const j = await res.json()
            const pp = j.product
            const option = (pp?.providerProductOptions || []).find((o: any) => o.id === it.optionId)
            const optionPrice = option?.price ?? undefined
            const mod = await import('@/lib/cart-price')
            const price = mod.resolveProductPrice(pp, buyerIsShop, optionPrice)
            map[`${it.providerProductId}-${it.optionId ?? 'base'}`] = price
          } catch (e) {
            // ignore
          }
        }))
        if (mounted) setPriceOverrides(map)
      } catch (e) {}
    })()
    return () => { mounted = false }
  }, [items])

  const total = items.reduce((sum: number, i: CartItem) => {
    const key = `${i.providerProductId}-${(i as any).optionId ?? 'base'}`
    const p = priceOverrides[key] ?? i.price ?? 0
    return sum + (p || 0) * i.quantity
  }, 0)
  const totals = buildCheckoutTotals(items.map((i: any) => ({ quantity: i.quantity, price: priceOverrides[`${i.providerProductId}-${i.optionId ?? 'base'}`] ?? i.price ?? 0 })), 0)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Avoid hydration mismatch by rendering a consistent skeleton until mounted
  if (!mounted) {
    return (
      <section className="cart-page container">
        <h1>{t('myCart')}</h1>
        <div className="cart-empty card" style={{ opacity: 0.6 }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🛒</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>{tc('loading')}</h3>
        </div>
      </section>
    )
  }

  return (
    <section className="cart-page container">
      <div className="cart-page-header">
        <div>
          <p className="cart-page-eyebrow">{t('myCart')}</p>
          <h1>{t('myCart')}</h1>
        </div>
        <Link href="/shop" className="btn btn-ghost">{t('continueShopping')}</Link>
      </div>

      {items.length === 0 && (
        <div className="cart-empty card">
          <div className="cart-empty-icon">🛒</div>
          <h3>{t('cartEmpty')}</h3>
          <p>{t('cartEmptyMessage')}</p>
          <Link href="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
        </div>
      )}

      {items.length > 0 && (
        <div className="cart-layout">
          <div className="cart-list">
            {items.map((i: any) => {
              const key = `${i.providerProductId}-${i.optionId ?? 'base'}`
              const p = priceOverrides[key] ?? i.price ?? 0
              const lineLabel = i.unitType || i.optionId || 'Item'
              return (
                <div key={key} className="cart-item card">
                  <div className="cart-item-copy">
                    <div className="cart-item-title">{i.title || i.providerProductId}</div>
                    <div className="cart-item-meta">
                      <span>{lineLabel}</span>
                      <span className="cart-item-price-pill">{p ? `${p.toFixed(2)} EGP` : '—'}</span>
                    </div>

                    <div className="cart-item-actions">
                      <div className="cart-qty-controls">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateQuantity(i.providerProductId, i.optionId, Math.max(0, i.quantity - 1))}>−</button>
                        <span className="cart-qty-value">{i.quantity}</span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => updateQuantity(i.providerProductId, i.optionId, i.quantity + 1)}>+</button>
                      </div>

                      <div className="cart-item-bottom">
                        <div className="cart-item-subtotal">{((p || 0) * i.quantity).toFixed(2)} EGP</div>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i.providerProductId, i.optionId)}>{tc('remove')}</button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <aside className="cart-summary card">
            <div className="cart-summary-row">
              <span>{tc('subtotal')}</span>
              <span className="price">{totals.itemsSubtotal.toFixed(2)} EGP</span>
            </div>
            <div className="cart-summary-row">
              <span>{t('deliveryFee') || 'Delivery fee'}</span>
              <span className="muted">{totals.shipping.toFixed(2)} EGP</span>
            </div>
            <div className="cart-summary-row total">
              <span>{tc('total')}</span>
              <span className="price">{totals.totalAmount.toFixed(2)} EGP</span>
            </div>
            <form action="/shop/checkout" method="get" className="cart-checkout-form">
              <button type="submit" className="btn btn-primary">{t('proceedToCheckout')}</button>
            </form>
          </aside>
        </div>
      )}
    </section>
  )
}
