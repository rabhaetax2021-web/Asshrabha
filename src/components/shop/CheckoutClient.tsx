"use client"

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'
import { buildCheckoutTotals } from '@/lib/order-pricing'

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
  const t = useTranslations('shop')
  const tc = useTranslations('common')
  const items = useCartStore((s: any) => s.items)
  const clear = useCartStore((s: any) => s.clear)
  const [loading, setLoading] = useState(false)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() => {
    const defaultAddr = addresses.find(a => a.isDefault)
    return defaultAddr?.id || addresses[0]?.id || ''
  })
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [showWalletModal, setShowWalletModal] = useState(false)

  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>({})
  const [checkoutTotals, setCheckoutTotals] = useState({ itemsSubtotal: 0, shipping: 0, totalAmount: 0 })

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

  const total = items.reduce((sum: number, i: any) => {
    const key = `${i.providerProductId}-${i.optionId ?? 'base'}`
    const p = priceOverrides[key] ?? i.price ?? 0
    return sum + (p || 0) * i.quantity
  }, 0)

  useEffect(() => {
    if (items.length === 0) {
      setCheckoutTotals({ itemsSubtotal: 0, shipping: 0, totalAmount: 0 })
      return
    }

    const payload = {
      items: items.map((i: any) => ({
        providerProductId: i.providerProductId,
        quantity: i.quantity,
        optionId: i.optionId,
      })),
      addressId: selectedAddressId || undefined,
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/shop/checkout/totals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Unable to calculate totals')
        const data = await res.json()
        if (!cancelled) {
          setCheckoutTotals(data?.totals || { itemsSubtotal: 0, shipping: 0, totalAmount: 0 })
        }
      } catch {
        if (!cancelled) {
          const fallback = buildCheckoutTotals(items.map((i: any) => ({ quantity: i.quantity, price: priceOverrides[`${i.providerProductId}-${i.optionId ?? 'base'}`] ?? i.price ?? 0 })), 0)
          setCheckoutTotals(fallback)
        }
      }
    })()

    return () => { cancelled = true }
  }, [items, priceOverrides, selectedAddressId])

  // Fetch wallet balance when payment method is WALLET
  useEffect(() => {
    if (paymentMethod !== 'WALLET') return
    
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/shop/wallet-balance')
        if (!res.ok) throw new Error('Failed to fetch wallet balance')
        const data = await res.json()
        if (!cancelled) {
          setWalletBalance(data.availableBalance ?? 0)
        }
      } catch (e) {
        if (!cancelled) {
          setWalletBalance(0)
        }
      }
    })()

    return () => { cancelled = true }
  }, [paymentMethod])

  async function place() {
    if (items.length === 0) {
      showToast(t('cartEmpty'), 'error')
      return
    }
    if (!selectedAddressId) {
      setShowAddressModal(true)
      showToast(t('selectAddress'), 'error')
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
          paymentMethod: paymentMethod,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        // Handle insufficient wallet balance specifically
        if (data?.code === 'insufficient_wallet_balance') {
          setShowWalletModal(true)
          return
        }
        throw new Error(data?.error || 'Failed to place order')
      }
      showToast(t('orderPlaced'), 'success')
      clear()
      window.location.href = '/shop/orders'
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally { setLoading(false) }
  }

  return (
    <section className="checkout container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
        {t('checkout')}
      </h1>
      {items.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🛒</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>{t('cartEmpty')}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-6)' }}>{t('cartEmptyMessage')}</p>
          <Link href="/shop" className="btn btn-primary">{t('continueShopping')}</Link>
        </div>
      )}

      {items.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {showAddressModal && !selectedAddressId && (
            <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3>{t('selectAddress')}</h3>
                <p>{t('cartEmptyMessage')}</p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/shop/profile/addresses" className="btn btn-primary">{t('addNewAddress')}</Link>
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAddressModal(false)}>{tc('close')}</button>
                </div>
              </div>
            </div>
          )}
          {/* Order Summary */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              📦 {t('orderSummary')}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>{tc('subtotal')}</span>
                <span>{checkoutTotals.itemsSubtotal.toFixed(2)} EGP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-base)', color: 'var(--text-muted)' }}>{t('deliveryFee') || 'Delivery fee'}</span>
                <span>{checkoutTotals.shipping.toFixed(2)} EGP</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>{tc('total')}</span>
                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>{checkoutTotals.totalAmount.toFixed(2)} EGP</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              🏠 {t('selectAddress')}
            </h3>
            {addresses.length === 0 && (
              <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>{t('noAddresses') || 'No saved addresses.'}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>{t('contactSupport')}</p>
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
                        {addr.isDefault && <span className="badge badge-success" style={{ fontSize: 'var(--text-2xs)' }}>{t('defaultAddress')}</span>}
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

          {/* Payment Method Selection */}
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              💳 {t('selectPaymentMethod')}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {/* Cash Payment Option */}
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'CASH' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: paymentMethod === 'CASH' ? 'var(--primary-50)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast) ease',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CASH"
                  checked={paymentMethod === 'CASH'}
                  onChange={() => setPaymentMethod('CASH')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                    {t('paymentMethodCash')}
                  </div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Pay when order is delivered
                  </div>
                </div>
              </label>

              {/* Wallet Payment Option */}
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  border: paymentMethod === 'WALLET' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                  background: paymentMethod === 'WALLET' ? 'var(--primary-50)' : 'var(--bg-secondary)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast) ease',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="WALLET"
                  checked={paymentMethod === 'WALLET'}
                  onChange={() => setPaymentMethod('WALLET')}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                    {t('paymentMethodWallet')}
                  </div>
                  {walletBalance !== null && (
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Balance: {walletBalance.toFixed(2)} EGP
                      {walletBalance < checkoutTotals.totalAmount && (
                        <div style={{ color: 'var(--warning-dark)', marginTop: '2px' }}>
                          ⚠️ Insufficient balance
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            disabled={loading || items.length === 0 || (paymentMethod === 'WALLET' && walletBalance !== null && walletBalance < checkoutTotals.totalAmount)}
            onClick={place}
            className="btn btn-primary"
            style={{
              width: '100%', padding: 'var(--space-4)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)',
              borderRadius: 'var(--radius-xl)', marginTop: 'var(--space-2)',
              opacity: loading || (paymentMethod === 'WALLET' && walletBalance !== null && walletBalance < checkoutTotals.totalAmount) ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
                <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                {t('placingOrder')}
              </span>
            ) : (
              `${t('placeOrder')} · ${checkoutTotals.totalAmount.toFixed(2)} EGP`
            )}
          </button>

          {!selectedAddressId && addresses.length > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--warning-dark)', fontSize: 'var(--text-sm)' }}>
              ⚠️ {t('selectAddress')}
            </p>
          )}

          {/* Insufficient Wallet Balance Modal */}
          {showWalletModal && (
            <div className="modal-overlay" onClick={() => setShowWalletModal(false)}>
              <div className="modal" onClick={(e) => e.stopPropagation()}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-4)', color: 'var(--warning-dark)' }}>
                  ⚠️ {t('insufficientWalletBalance')}
                </h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)', lineHeight: '1.6' }}>
                  {t('walletBalanceError')}
                </p>
                <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/shop/profile/wallet" className="btn btn-primary" onClick={() => setShowWalletModal(false)}>
                    {t('addMoneyToWallet')}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setShowWalletModal(false)
                      setPaymentMethod('CASH')
                    }}
                  >
                    {t('choosePaymentMethod')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}