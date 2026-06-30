"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from './Icon'

export default function MobileHeader() {
  const pathname = usePathname()

  if (!pathname || !pathname.startsWith('/shop')) {
    return null
  }

  return (
    <header className="mobile-header">
      <div className="mobile-header-left">
        <Link href="/shop" aria-label="Home" className="logo-link">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M3 12h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 3v18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
      <div className="mobile-header-center">
        <Link href="/shop/search" className="search-link">Ashrabha-أشربها</Link>
      </div>
      <div className="mobile-header-right">
        <Link href="/shop/cart" aria-label="Cart"><Icon name="ShoppingCart" /></Link>
      </div>
    </header>
  )
}
