"use client"

import Link from "next/link";
import React from "react";
import { useTranslations } from 'next-intl'

interface Props { collapsed?: boolean; initialLocale?: 'ar'|'en' }

export default function ProviderSidebar({ collapsed = false, initialLocale = 'ar' }: Props) {
  const t = useTranslations('provider')
  const tc = useTranslations('common')
  const [locale, setLocaleState] = React.useState<'ar'|'en'>(() => {
    if (typeof document === 'undefined') return initialLocale
    const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
    const cookieLocale = (m ? decodeURIComponent(m[1]) : null) as 'ar'|'en'|null
    return cookieLocale || initialLocale
  })
  const [open, setOpen] = React.useState(false)

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
        onClick={() => setOpen(true)}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 1.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M0 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M0 12.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
      </button>

      <aside className={"sidebar provider-sidebar " + (collapsed ? "sidebar-collapsed" : "") + (open ? ' sidebar-open' : '') }>
      <div className="sidebar-header provider-sidebar-header">
        <Link href="/provider" className="logo">
          <span className="logo-text">{t('store')}</span>
        </Link>
        <button
          type="button"
          aria-label="Close menu"
          className="btn-icon sidebar-close hide-desktop"
          onClick={() => setOpen(false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 3L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M15 3L3 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </button>
      </div>

      <nav className="sidebar-nav provider-nav">
        <ul>
          <li><Link href="/provider" className="sidebar-item">{t('dashboard')}</Link></li>
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
        <div className="user">
          <div className="avatar" />
          <div className="sidebar-user-info user-info">
            <div className="name-row">
              <div className="name">Store Owner</div>
              <div className="footer-actions">
                <div className="lang-toggle" role="tablist" aria-label="Language">
                  <button type="button" className={"btn btn-sm " + (locale === 'ar' ? 'btn-primary' : 'btn-ghost')} onClick={() => setLocale('ar')} aria-pressed={locale === 'ar'}>AR</button>
                  <button type="button" className={"btn btn-sm " + (locale === 'en' ? 'btn-primary' : 'btn-ghost')} onClick={() => setLocale('en')} aria-pressed={locale === 'en'}>EN</button>
                </div>
                <button type="button" className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} aria-label="Logout">{tc('logout')}</button>
              </div>
            </div>
            <div className="role">PROVIDER</div>
          </div>
        </div>
      </div>
      </aside>

      <div className={"sidebar-overlay " + (open ? "sidebar-overlay-visible" : "")} onClick={() => setOpen(false)} />
    </>
  )
}
