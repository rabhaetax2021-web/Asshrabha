"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils/helpers'

interface Props {
  collapsed?: boolean;
  initialLocale?: 'ar' | 'en';
}

export default function AdminSidebar({ collapsed = false, initialLocale = 'ar' }: Props) {
  const [locale, setLocaleState] = useState<'ar'|'en'>(() => {
    if (typeof document === 'undefined') return initialLocale
    const m = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
    const cookieLocale = (m ? decodeURIComponent(m[1]) : null) as 'ar'|'en'|null
    return cookieLocale || initialLocale
  })
  const [open, setOpen] = useState(false)
  const [walletSection, setWalletSection] = useState<'customers' | 'providers' | null>(null)
  const [reportsOpen, setReportsOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('admin')
  const tc = useTranslations('common')

  const setSidebarOpen = (nextOpen: boolean) => {
    setOpen(nextOpen)
    if (typeof document === 'undefined') return

    const sidebar = document.querySelector('.admin-sidebar') as HTMLElement | null
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

  const submenuListStyle = { paddingLeft: 12, marginTop: 6, borderLeft: '2px solid var(--border-light)', marginLeft: 8 } as const
  const submenuItemStyle = { paddingLeft: 12, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' } as const

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

      <aside className={cn('sidebar admin-sidebar', collapsed && 'sidebar-collapsed', open && 'sidebar-open')}>
      <div className="sidebar-header admin-sidebar-header">
        <Link href="/admin" className="logo">
          <span className="logo-text">{tc('appName')}</span>
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

      <nav className="sidebar-nav admin-nav" onClick={(event) => {
        const target = event.target as HTMLElement
        if (target.closest('a.sidebar-item')) {
          setSidebarOpen(false)
        }
      }}>
        <ul>
          <li>
            <Link href="/admin" className="sidebar-item">{t('dashboard')}</Link>
          </li>
          <li>
            <Link href="/admin/notifications" className="sidebar-item">{tc('notifications')}</Link>
          </li>
          <li>
            <button
              type="button"
              className="sidebar-item sidebar-collapsible"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setWalletSection(prev => prev === 'customers' ? null : 'customers')}
              aria-expanded={walletSection === 'customers'}
              aria-label={t('clientWallets')}
            >
              <span>{t('customers')}</span>
              <span>{walletSection === 'customers' ? '-' : '>'}</span>
            </button>
            {walletSection === 'customers' && (
              <ul className="sidebar-submenu" style={submenuListStyle}>
                <li><Link href="/admin/accounts/customers" className="sidebar-item" style={submenuItemStyle}>• {t('customers')}</Link></li>
                <li><Link href="/admin/customer-profile-edits" className="sidebar-item" style={submenuItemStyle}>• {t('customerProfileEdits') || 'Customer Edits'}</Link></li>
                <li><Link href="/admin/wallet/deposit-requests" className="sidebar-item" style={submenuItemStyle}>• {t('depositRequests')}</Link></li>
                <li><Link href="/admin/wallet/withdraw-requests" className="sidebar-item" style={submenuItemStyle}>• {t('withdrawRequests')}</Link></li>
                <li><Link href="/admin/wallet/history" className="sidebar-item" style={submenuItemStyle}>• {t('history')}</Link></li>
                <li><Link href="/admin/wallet/payment-methods" className="sidebar-item" style={submenuItemStyle}>• {t('paymentMethods')}</Link></li>
              </ul>
            )}
          </li>
          <li>
            <button
              type="button"
              className="sidebar-item sidebar-collapsible"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setWalletSection(prev => prev === 'providers' ? null : 'providers')}
              aria-expanded={walletSection === 'providers'}
              aria-label={t('providerWallets')}
            >
              <span>{t('providers')}</span>
              <span>{walletSection === 'providers' ? '-' : '>'}</span>
            </button>
            {walletSection === 'providers' && (
              <ul className="sidebar-submenu" style={submenuListStyle}>
                <li><Link href="/admin/accounts/providers" className="sidebar-item" style={submenuItemStyle}>• {t('providers')}</Link></li>
                <li><Link href="/admin/provider-profile-edits" className="sidebar-item" style={submenuItemStyle}>• {t('providerProfileEdits') || 'Profile Edits'}</Link></li>
                <li><Link href="/admin/wallet/providers/deposit-requests" className="sidebar-item" style={submenuItemStyle}>• {t('depositRequests')}</Link></li>
                <li><Link href="/admin/wallet/providers/withdraw-requests" className="sidebar-item" style={submenuItemStyle}>• {t('withdrawRequests')}</Link></li>
                <li><Link href="/admin/wallet/providers/history" className="sidebar-item" style={submenuItemStyle}>• {t('history')}</Link></li>
                <li><Link href="/admin/wallet/providers/payment-methods" className="sidebar-item" style={submenuItemStyle}>• {t('paymentMethods')}</Link></li>
              </ul>
            )}
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
            <button
              type="button"
              className="sidebar-item sidebar-collapsible"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onClick={() => setReportsOpen(prev => !prev)}
              aria-expanded={reportsOpen}
              aria-label={t('reports') || 'Reports'}
            >
              <span>{t('reports') || 'Reports'}</span>
              <span>{reportsOpen ? '-' : '>'}</span>
            </button>
            {reportsOpen && (
              <ul className="sidebar-submenu" style={submenuListStyle}>
                <li><Link href="/admin/reports/clients" className="sidebar-item" style={submenuItemStyle}>• {t('clientsReport') || 'Clients'}</Link></li>
                <li><Link href="/admin/reports/providers" className="sidebar-item" style={submenuItemStyle}>• {t('providersReport') || 'Providers'}</Link></li>
                <li><Link href="/admin/reports/products" className="sidebar-item" style={submenuItemStyle}>• {t('productsReport') || 'Products'}</Link></li>
                <li><Link href="/admin/reports/orders" className="sidebar-item" style={submenuItemStyle}>• {t('ordersReport') || 'Orders'}</Link></li>
              </ul>
            )}
          </li>
          <li>
            <Link href="/admin/settings" className="sidebar-item">{t('settings')}</Link>
          </li>
          <li>
            <Link href="/admin/templates" className="sidebar-item">{t('templates')}</Link>
          </li>
        </ul>
      </nav>
      <div className="sidebar-footer admin-sidebar-footer">
        <div className="sidebar-user-row">
          <div className="avatar" />
          <div className="sidebar-user-info user-info">
            <div className="name">{tc('profile')}</div>
            <div className="role">{t('rootAdmin')}</div>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm logout-btn" onClick={handleLogout} aria-label="Logout">{tc('logout')}</button>
      </div>
      </aside>

      <div className={cn('sidebar-overlay', open && 'sidebar-overlay-visible')} onClick={() => setSidebarOpen(false)} />
    </>
  );
}
