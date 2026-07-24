"use client"
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useCartStore } from '@/stores/cartStore'
import Link from 'next/link'

export default function CartPopup() {
  const t = useTranslations('shop')
  const tc = useTranslations('common')
  const items = useCartStore(s => s.items)
  const isOpen = useCartStore(s => s.isOpen)
  const setOpen = useCartStore(s => s.setOpen)
  const remove = useCartStore(s => s.removeItem)
  const updateQuantity = useCartStore(s => s.updateQuantity)
  const pathname = usePathname()

  const totalCount = items.reduce((s, it) => s + (it.quantity || 0), 0)
  const sheetRef = useRef<HTMLDivElement | null>(null)
  const [pulse, setPulse] = useState(false)
  const [live, setLive] = useState('')
  const prevCountRef = useRef<number>(totalCount)

  useEffect(() => {
    const prev = prevCountRef.current
    if (totalCount !== prev) {
      if (totalCount > prev) setLive(`Added to cart. ${totalCount} items in cart.`)
      else setLive(`Cart updated. ${totalCount} items in cart.`)
      // pulse the FAB briefly when items increase
      if (totalCount > prev) {
        setPulse(true)
        const t = setTimeout(() => setPulse(false), 420)
        return () => clearTimeout(t)
      }
      prevCountRef.current = totalCount
    }
    prevCountRef.current = totalCount
  }, [totalCount])

  useEffect(() => {
    if (pathname === '/shop/cart' || pathname === '/shop/checkout') {
      setOpen(false)
    }
  }, [pathname, setOpen])

  useEffect(() => {
    if (!isOpen) return
    const el = sheetRef.current
    if (!el) return
    const focusable = Array.from(el.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])"))
      .filter(f => !f.hasAttribute('disabled'))
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const prevActive = document.activeElement as HTMLElement | null
    if (first) first.focus()

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 'Tab') {
        if (focusable.length === 0) { e.preventDefault(); return }
        if (e.shiftKey) {
          if (document.activeElement === first) { e.preventDefault(); last?.focus() }
        } else {
          if (document.activeElement === last) { e.preventDefault(); first?.focus() }
        }
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      try { prevActive?.focus() } catch (e) {}
    }
  }, [isOpen, setOpen])

  return (
    <>
      {/* Floating cart button for mobile */}
      <button aria-label="Open cart" className={`cart-fab ${pulse ? 'pulse' : ''}`} aria-expanded={isOpen} aria-controls="cart-sheet" onClick={() => setOpen(true)}>
        🛒{totalCount > 0 && <span className="cart-fab-count">{totalCount}</span>}
      </button>
      <div aria-live="polite" className="sr-only" role="status">{live}</div>

      { !isOpen || pathname === '/shop/cart' || pathname === '/shop/checkout' ? null : (
        <div className="cart-popup-backdrop" onClick={() => setOpen(false)}>
          <div id="cart-sheet" ref={sheetRef} className="cart-popup" role="dialog" aria-modal="true" aria-label="Cart" onClick={(e) => e.stopPropagation()}>
        <h3>{t('myCart')}</h3>
        <div className="cart-items">
          {items.length === 0 && <div className="empty">{t('cartEmpty')}</div>}
          {items.map((it, idx) => (
            <div key={`${it.providerProductId}-${it.optionId ?? 'base'}`} className="cart-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {it.image && <img src={it.image} alt={it.title || 'product'} className="cart-thumb" />}
                <div>
                  <div className="title">{it.title || 'Product'}</div>
                  <div className="meta">{it.price ? `${it.price} EGP` : '—'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(it.providerProductId, it.optionId, Math.max(0, it.quantity - 1))}>−</button>
                <div style={{ minWidth: 28, textAlign: 'center' }}>{it.quantity}</div>
                <button className="btn btn-ghost btn-sm" onClick={() => updateQuantity(it.providerProductId, it.optionId, it.quantity + 1)}>+</button>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(it.providerProductId, it.optionId)}>{tc('remove')}</button>
                <div style={{ minWidth: 80, textAlign: 'right', fontWeight: 600 }}>{it.price ? `${(it.price * it.quantity).toFixed(2)} EGP` : '—'}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="cart-actions">
          <Link href="/shop/cart" className="btn" onClick={() => setOpen(false)}>{t('continueShopping')}</Link>
          <button className="btn btn-secondary" onClick={() => setOpen(false)}>{t('keepShopping') || 'Keep Shopping'}</button>
        </div>
          </div>
          <style jsx>{`
            .cart-popup-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1200;animation: fadeIn 200ms ease both}
            .cart-popup{background:#fff;padding:16px;border-radius:8px;max-width:420px;width:94%;box-shadow:0 6px 24px rgba(0,0,0,0.2);animation: slideUp 240ms cubic-bezier(.2,.9,.2,1) both}
            .cart-items{max-height:320px;overflow:auto;margin:12px 0}
            .cart-item{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #eee}
            .cart-actions{display:flex;gap:8px;justify-content:flex-end}

            /* Floating cart button */
            .cart-fab{display:none}
            .cart-fab{position:fixed;right:12px;bottom:calc(var(--bottom-nav-height) + 18px);z-index:1400;background:var(--accent);color:#fff;border:none;padding:10px 14px;border-radius:999px;box-shadow:0 8px 28px rgba(0,0,0,0.18);font-weight:600;transition:transform 160ms ease, box-shadow 160ms ease}
            .cart-fab:active{transform:scale(0.96)}
            .cart-fab.show{transform:translateY(0);opacity:1}
            .cart-fab-count{background:rgba(0,0,0,0.14);padding:2px 6px;border-radius:999px;margin-left:8px;font-weight:700}
            .cart-fab.pulse{ animation: cartPulse 420ms cubic-bezier(.2,.9,.2,1) both }
            @keyframes cartPulse { 0% { transform: scale(1) } 40% { transform: scale(1.06) } 100% { transform: scale(1) } }
            .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

            @keyframes slideUp { from { transform: translateY(18px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

            @media (max-width:640px){
              .cart-fab{display:flex;align-items:center}
              .cart-fab{transition:transform 250ms cubic-bezier(.2,.9,.2,1)}
              .cart-popup{border-radius:12px 12px 0 0; width:100%; max-width:100%; height:60vh; margin-top:auto; align-self:flex-end}
              .cart-popup-backdrop{align-items:flex-end}
            }
          `}</style>
        </div>
      )}
    </>
  )
}

// end of file
