"use client"
import Link from 'next/link'
import Icon from './Icon'

export default function BottomNav() {
  return (
    <nav className="bottom-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 'var(--bottom-nav-height)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', borderTop: '1px solid var(--border-light)', background: 'var(--bg-elevated)', zIndex: 120 }}>
      <Link href="/shop" aria-label="Home"><Icon name="Home" /><div style={{ fontSize: 12 }}>Home</div></Link>
      <Link href="/shop/search" aria-label="Search"><Icon name="Search" /><div style={{ fontSize: 12 }}>Search</div></Link>
      <Link href="/shop/cart" aria-label="Cart"><Icon name="ShoppingCart" /><div style={{ fontSize: 12 }}>Cart</div></Link>
      <Link href="/shop/profile" aria-label="Profile"><Icon name="User" /><div style={{ fontSize: 12 }}>Profile</div></Link>
    </nav>
  )
}
