"use client"
import Button from './Button'
import { useTheme } from './ThemeProvider'
import Link from 'next/link'
import NotificationBell from './NotificationBell'

export default function Topbar({ title }: { title?: string }) {
  const { theme, toggle } = useTheme()

  const handleToggleSidebar = () => {
    if (typeof window === 'undefined') return

    const sidebar = document.querySelector('.admin-sidebar, .provider-sidebar') as HTMLElement | null
    const overlay = document.querySelector('.sidebar-overlay') as HTMLElement | null

    if (!sidebar) return

    const isOpen = sidebar.classList.contains('sidebar-open')
    sidebar.classList.toggle('sidebar-open', !isOpen)

    if (overlay) {
      overlay.classList.toggle('sidebar-overlay-visible', !isOpen)
    }
  }

  return (
    <header className="topbar" style={{ height: 'var(--topbar-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-6)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)', position: 'sticky', top: 0, zIndex: 1100, width: '100%', flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className="btn-icon sidebar-header-toggle"
          aria-label="Open menu"
          onClick={handleToggleSidebar}
        >
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 1.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M0 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M0 12.5H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="logo"><strong>Asshrabha</strong></Link>
        {title && <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h2>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <NotificationBell />
        <Button variant="ghost" onClick={() => toggle()} aria-label="Toggle theme">{theme === 'dark' ? '🌙' : '☀️'}</Button>
      </div>
    </header>
  )
}
