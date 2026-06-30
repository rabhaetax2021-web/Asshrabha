"use client"
import { useState } from 'react';
import Link from 'next/link'
import { showToast } from '@/components/ui/toast'

export default function ProfileActions() {
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      showToast('Logged out', 'success')
      window.location.href = '/login'
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Link href="/shop/profile/edit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
        <span>✏️</span> Edit Profile
      </Link>
      <Link href="/shop/profile/addresses" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
        <span>📍</span> Manage Addresses
      </Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <Link href="/shop/wallet" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>💰</span> Wallet
        </Link>
        <Link href="/shop/orders" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>📋</span> Orders
        </Link>
        <Link href="/shop/support" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>💬</span> Chat Support
        </Link>
        <Link href="/shop" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>🏪</span> Shop
        </Link>
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="btn btn-danger"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}
      >
        <span>🚪</span> {loading ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  )
}
