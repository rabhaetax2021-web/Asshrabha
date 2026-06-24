"use client"
import React from 'react'
import Button from './Button'
import { useTheme } from './ThemeProvider'
import Link from 'next/link'

export default function Topbar({ title }: { title?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <header className="topbar" style={{ height: 'var(--topbar-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-6)', borderBottom: '1px solid var(--border-light)', background: 'var(--bg-elevated)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/" className="logo"><strong>Asshrabha</strong></Link>
        {title && <h2 style={{ margin: 0, fontSize: 'var(--text-lg)' }}>{title}</h2>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Button variant="ghost" onClick={() => toggle()} aria-label="Toggle theme">{theme === 'dark' ? '🌙' : '☀️'}</Button>
      </div>
    </header>
  )
}
