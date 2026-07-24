"use client"
import { useState } from 'react';
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { showToast } from '@/components/ui/toast'

export default function ProfileActions() {
  const t = useTranslations('shop')
  const tc = useTranslations('common')
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      showToast(t('loggedOut'), 'success')
      window.location.href = '/login'
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <Link href="/shop/profile/edit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
        <span>✏️</span> {t('editProfile')}
      </Link>
      <Link href="/shop/profile/addresses" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
        <span>📍</span> {t('manageAddresses')}
      </Link>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <Link href="/shop/wallet" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>💰</span> {t('wallet')}
        </Link>
        <Link href="/shop/orders" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>📋</span> {t('ordersAction')}
        </Link>
        <Link href="/shop/support" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>💬</span> {t('chatSupport')}
        </Link>
        <Link href="/shop" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
          <span>🏪</span> {t('shopAction')}
        </Link>
      </div>
      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="btn btn-danger"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}
      >
        <span>🚪</span> {loading ? t('loggingOut') : tc('logout')}
      </button>
    </div>
  )
}
