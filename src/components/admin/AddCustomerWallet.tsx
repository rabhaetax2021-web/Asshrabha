'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

type Customer = {
  id: string
  mobile: string
  nameEN?: string | null
  nameAR?: string | null
  wallet?: { availableBalance: number; pendingBalance: number } | null
}

export default function AddCustomerWallet() {
  const t = useTranslations('admin')
  const [number, setNumber] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selected, setSelected] = useState<Customer | null>(null)
  const [amount, setAmount] = useState('')
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  async function search(event: React.FormEvent) {
    event.preventDefault()
    setSelected(null)
    setSearching(true)
    try {
      const response = await fetch(`/api/admin/wallet/customers/search?number=${encodeURIComponent(number)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || t('failed'))
      setCustomers(data.customers || [])
    } catch (error: unknown) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setSearching(false)
    }
  }

  async function addBalance(event: React.FormEvent) {
    event.preventDefault()
    if (!selected) return
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return showToast(t('enterValidAmount'), 'error')

    setSaving(true)
    try {
      const response = await fetch(`/api/admin/wallet/customers/${selected.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || t('failed'))
      setSelected({ ...selected, wallet: data.wallet })
      setAmount('')
      showToast(t('balanceAdded'), 'success')
    } catch (error: unknown) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)', maxWidth: 720 }}>
      <form onSubmit={search} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <input className="input" value={number} onChange={(event) => setNumber(event.target.value)} placeholder={t('accountNumberPlaceholder')} inputMode="tel" required />
        <button className="btn btn-primary" type="submit" disabled={searching}>{searching ? t('processing') : t('searchAccount')}</button>
      </form>

      {customers.length > 0 && (
        <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          {customers.map((customer) => (
            <button key={customer.id} type="button" className="btn btn-secondary" onClick={() => setSelected(customer)} style={{ textAlign: 'start' }}>
              {customer.nameEN || customer.nameAR || t('customer')} · {customer.mobile}
            </button>
          ))}
        </div>
      )}

      {number.length >= 3 && !searching && customers.length === 0 && <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-5)' }}>{t('noAccountsFound')}</p>}

      {selected && (
        <form onSubmit={addBalance} style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'end', marginTop: 'var(--space-6)' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div className="label">{selected.nameEN || selected.nameAR || selected.mobile}</div>
            <div style={{ color: 'var(--text-muted)' }}>{t('availableBalance')}: {Number(selected.wallet?.availableBalance || 0).toFixed(2)} EGP</div>
          </div>
          <input className="input" type="number" step="0.01" min="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={t('amountEgp')} required />
          <button className="btn btn-primary" type="submit" disabled={saving}>{saving ? t('processing') : t('addBalance')}</button>
        </form>
      )}
    </div>
  )
}