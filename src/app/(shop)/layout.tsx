import React from 'react'
import Link from 'next/link'
import FooterTabs from '@/components/shop/FooterTabs'

export const metadata = { title: 'Shop - Asshrabha' }

export default function ShopRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop-root">
      <header className="shop-header">
        <Link href="/shop" className="logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="logo-text">Asshrabha</span>
        </Link>
        <nav className="shop-header-nav">
          <Link href="/shop" className="btn-ghost">Home</Link>
          <Link href="/shop/search" className="btn-ghost">Search</Link>
          <Link href="/shop/cart" className="btn-ghost">Cart</Link>
          <Link href="/shop/orders" className="btn-ghost">Orders</Link>
          <Link href="/shop/profile" className="btn-ghost">Profile</Link>
        </nav>
      </header>
      <main className="shop-main">{children}</main>
      <FooterTabs />
    </div>
  )
}

