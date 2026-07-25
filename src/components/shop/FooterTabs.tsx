"use client"
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import './footer-tabs.css'

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'home': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5L12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'cart': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 6h15l-1.5 9h-12L6 6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="10" cy="20" r="1" fill="currentColor"/><circle cx="18" cy="20" r="1" fill="currentColor"/></svg>
    case 'orders': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15V6a2 2 0 0 0-2-2H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 8h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 21v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'profile': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    case 'search': return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
    default: return null
  }
}

export default function FooterTabs() {
  const t = useTranslations('shop')
  const path = usePathname()
  const router = useRouter()

  const isCheckoutPath = path === '/shop/cart' || path === '/shop/checkout'

  return (
    <nav className="footer-tabs">
      <Link href="/shop" className={path === '/shop' ? 'tab active' : 'tab'} title={t('home')}><Icon name="home"/><span>{t('home')}</span></Link>
      <Link href="/shop/checkout" className={isCheckoutPath ? 'tab active' : 'tab'} title={t('checkout')}><Icon name="cart"/><span>{t('checkout')}</span></Link>
      <Link href="/shop/orders" className={path === '/shop/orders' ? 'tab active' : 'tab'} title={t('orders')}><Icon name="orders"/><span>{t('orders')}</span></Link>
      <Link href="/shop/profile" className={path === '/shop/profile' ? 'tab active' : 'tab'} title={t('profile')}><Icon name="profile"/><span>{t('profile')}</span></Link>
    </nav>
  )
}
