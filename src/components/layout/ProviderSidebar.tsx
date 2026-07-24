"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/helpers'

interface Props { collapsed?: boolean; initialLocale?: 'ar'|'en' }

export default function ProviderSidebar({ collapsed = false, initialLocale = 'ar' }: Props) {
  const t = useTranslations('provider')
  const tc = useTranslations('common')
  const pathname = usePathname()
  const [locale, setLocaleState] = useState<'ar'|'en'>(() => {
    if (typeof document === 'undefined') return initialLocale
    const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
    const cookieLocale = (m ? decodeURIComponent(m[1]) : null) as 'ar'|'en'|null
    return cookieLocale || initialLocale
  })
  const [open, setOpen] = useState(false)

  const setSidebarOpen = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (typeof document === 'undefined') return

    const sidebar = document.querySelector('.provider-sidebar') as HTMLElement | null
    const overlay = document.querySelector('.sidebar-overlay') as HTMLElement | null

    if (sidebar) {
      sidebar.classList.toggle('sidebar-open', nextOpen)
    }
    if (overlay) {
      overlay.classList.toggle('sidebar-overlay-visible', nextOpen)
    }
  }

  useEffect(() => {
    if (!open) return
    setSidebarOpen(false)
  }, [pathname, open])

  // Locale is initialized from cookie above to avoid calling setState in effect

  const setLocale = (newLocale: 'ar'|'en') => {
    if (typeof document === 'undefined') return
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
    setLocaleState(newLocale)
    window.location.reload()
  }

  const handleLogout = async () => {
    try { await fetch('/api/auth/signout', { method: 'POST' }) } catch (e) {}
    window.location.href = '/login'
  }

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        className="btn-icon sidebar-hamburger hide-desktop"
        onClick={() => setSidebarOpen(true)}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M0 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M0 12.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      <aside className={cn('sidebar provider-sidebar', collapsed && 'sidebar-collapsed', open && 'sidebar-open')}>
      <div className="sidebar-header provider-sidebar-header">
        <Link href="/provider" className="logo">
          <span className="logo-text">{t('store')}</span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          className="btn-icon sidebar-close hide-desktop"
          onClick={() => setSidebarOpen(false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <nav className="sidebar-nav provider-nav" onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('a.sidebar-item')) {
          setSidebarOpen(false)
        }
      }}>
        <ul>
          <li><Link href="/provider" className="sidebar-item">{t('dashboard')}</Link></li>
          <li><Link href="/provider/notifications" className="sidebar-item">{tc('notifications')}</Link></li>
          <li><Link href="/provider/store" className="sidebar-item">{t('store')}</Link></li>
          <li><Link href="/provider/delivery-areas" className="sidebar-item">{t('deliveryAreas')}</Link></li>
          <li><Link href="/provider/products" className="sidebar-item">{t('products')}</Link></li>
          <li><Link href="/provider/products/catalog" className="sidebar-item">{t('browseCatalog')}</Link></li>
          <li><Link href="/provider/orders" className="sidebar-item">{t('orders')}</Link></li>
          <li><Link href="/provider/wallet" className="sidebar-item">{t('wallet')}</Link></li>
          <li><Link href="/provider/suggestions" className="sidebar-item">{t('suggestions')}</Link></li>
        </ul>
      </nav>

      <div className="sidebar-footer provider-sidebar-footer">
        <div className="sidebar-user-row">
          <div className="avatar" />
          <div className="sidebar-user-info user-info">
            <div className="name">Store Owner</div>
            <div className="role">PROVIDER</div>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} aria-label="Logout">{tc('logout')}</button>
      </div>
      </aside>

      <div className={cn('sidebar-overlay', open && 'sidebar-overlay-visible')} onClick={() => setSidebarOpen(false)} />
    </>
  )
}
