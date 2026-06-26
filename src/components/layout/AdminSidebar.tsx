"use client"

import Link from "next/link";
import React from "react";
import { useTranslations } from 'next-intl'

interface Props {
  collapsed?: boolean;
  initialLocale?: 'ar' | 'en';
}

export default function AdminSidebar({ collapsed = false, initialLocale = 'ar' }: Props) {
  const [locale, setLocaleState] = React.useState<'ar'|'en'>(() => {
    if (typeof document === 'undefined') return initialLocale
    const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
    const cookieLocale = (m ? decodeURIComponent(m[1]) : null) as 'ar'|'en'|null
    return cookieLocale || initialLocale
  })
  const [open, setOpen] = React.useState(false)
  const t = useTranslations('admin')
  const tc = useTranslations('common')

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch (e) {
      // ignore
    }
    window.location.href = '/login'
  }
  // Locale is initialized from cookie above to avoid calling setState in effect

  const setLocale = (newLocale: 'ar'|'en') => {
    if (typeof document === 'undefined') return
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}`
    setLocaleState(newLocale)
    window.location.reload()
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

      <aside className={"sidebar admin-sidebar " + (collapsed ? "sidebar-collapsed" : "") + (open ? ' sidebar-open' : '') }>
      <div className="sidebar-header admin-sidebar-header">
        <Link href="/admin" className="logo">
          <span className="logo-text">{tc('appName')}</span>
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

      <nav className="sidebar-nav admin-nav">
        <ul>
          <li>
            <Link href="/admin" className="sidebar-item">{t('dashboard')}</Link>
          </li>
          <li>
            <Link href="/admin/accounts/providers" className="sidebar-item">{t('providers')}</Link>
          </li>
          <li>
            <Link href="/admin/accounts/customers" className="sidebar-item">{t('customers')}</Link>
          </li>
          <li>
            <Link href="/admin/categories" className="sidebar-item">{t('categories')}</Link>
          </li>
          <li>
            <Link href="/admin/catalog" className="sidebar-item">{t('catalog')}</Link>
          </li>
          <li>
            <Link href="/admin/approvals" className="sidebar-item">{t('approvals')}</Link>
          </li>
          <li>
            <Link href="/admin/locations" className="sidebar-item">{t('locations') || 'Locations'}</Link>
          </li>
          <li>
            <Link href="/admin/provider-profile-edits" className="sidebar-item">{t('providerProfileEdits') || 'Profile Edits'}</Link>
          </li>
          <li>
            <Link href="/admin/customer-profile-edits" className="sidebar-item">{t('customerProfileEdits') || 'Customer Edits'}</Link>
          </li>
          <li>
            <Link href="/admin/orders" className="sidebar-item">{t('orders')}</Link>
          </li>
          <li>
            <Link href="/admin/support" className="sidebar-item">{t('support')}</Link>
          </li>
          <li>
            <Link href="/admin/analytics" className="sidebar-item">{t('analytics')}</Link>
          </li>
          <li>
            <Link href="/admin/hero" className="sidebar-item">{t('hero') || 'Hero'}</Link>
          </li>
          <li>
            <Link href="/admin/settings" className="sidebar-item">{t('settings')}</Link>
          </li>
          <li>
            <Link href="/admin/templates" className="sidebar-item">{t('templates')}</Link>
          </li>
          <li>
            <div className="sidebar-item sidebar-collapsible" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Link href="/admin/wallet" className="no-underline">{t('wallet')}</Link>
              <button type="button" className="btn-icon btn-sm" onClick={() => setOpen(prev => !prev)} aria-expanded={open} aria-label="Toggle wallet submenu">{open ? '-' : '>'}</button>
            </div>
            {open && (
              <ul className="sidebar-submenu" style={{ paddingLeft: 12, marginTop: 6 }}>
                <li><Link href="/admin/wallet/deposit-requests" className="sidebar-item">{t('depositRequests')}</Link></li>
                <li><Link href="/admin/wallet/withdraw-requests" className="sidebar-item">{t('withdrawRequests')}</Link></li>
                <li><Link href="/admin/wallet/history" className="sidebar-item">{t('history')}</Link></li>
                <li><Link href="/admin/wallet/payment-methods" className="sidebar-item">{t('paymentMethods')}</Link></li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <div className="sidebar-footer admin-sidebar-footer">
        <div className="user">
          <div className="avatar" />
          <div className="sidebar-user-info user-info">
            <div className="name-row">
              <div className="name">{tc('profile')}</div>
              <div className="footer-actions">
                <div className="lang-toggle" role="tablist" aria-label="Language">
                  <button
                    type="button"
                    className={"btn btn-sm " + (locale === 'ar' ? 'btn-primary' : 'btn-ghost')}
                    onClick={() => setLocale('ar')}
                    aria-pressed={locale === 'ar'}
                  >{tc('arabic')}</button>
                  <button
                    type="button"
                    className={"btn btn-sm " + (locale === 'en' ? 'btn-primary' : 'btn-ghost')}
                    onClick={() => setLocale('en')}
                    aria-pressed={locale === 'en'}
                  >{tc('english')}</button>
                </div>
                <button type="button" className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} aria-label="Logout">{tc('logout')}</button>
              </div>
            </div>
            <div className="role">{t('rootAdmin')}</div>
          </div>
        </div>
      </div>
      </aside>

      <div className={"sidebar-overlay " + (open ? "sidebar-overlay-visible" : "")} onClick={() => setOpen(false)} />
    </>
  );
}
