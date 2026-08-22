'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

type CustomerWallet = {
  availableBalance: number
  pendingBalance: number
  transactions: Array<{ id: string; amount: number; type: string; status: string; createdAt: string }>
}

type Customer = {
  id: string
  nameEN?: string | null
  nameAR?: string | null
  mobile?: string | null
  wallet?: CustomerWallet | null
}

export default function CustomerWalletManager({ customers }: { customers: Customer[] }) {
  const t = useTranslations('admin')
  const [selectedId, setSelectedId] = useState(customers[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<Record<string, CustomerWallet | null>>(() => Object.fromEntries(customers.map((customer) => [customer.id, customer.wallet || null])))
  const customer = useMemo(() => customers.find((item) => item.id === selectedId) || customers[0], [customers, selectedId])
  const wallet = wallets[customer?.id || ''] || null

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!customer?.id) return

    const value = Number(amount)
    if (!value || value <= 0) {
      showToast(t('enterValidAmount'), 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/wallet/customers/${customer.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || t('failed'))

      setWallets((previous) => ({ ...previous, [customer.id]: data.wallet }))
      setAmount('')
      showToast(t('balanceAdded'), 'success')
    } catch (error: unknown) {
      showToast(getErrorMessage(error), 'error')
    } finally {
      setLoading(false)
    }
  }

  if (!customers.length) return <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>{t('noCustomers')}</div>

  return (
    <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'end' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label" htmlFor="customer-wallet-select">{t('customer')}</label>
          <select id="customer-wallet-select" className="input" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {customers.map((item) => <option key={item.id} value={item.id}>{item.nameEN || item.nameAR || item.mobile || item.id}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 150 }}>
          <div className="label">{t('availableBalance')}</div>
          <strong>{wallet ? Number(wallet.availableBalance).toFixed(2) : '0.00'} EGP</strong>
        </div>
        <form onSubmit={submit} style={{ display: 'flex', gap: 'var(--space-3)', flex: 1, minWidth: 280 }}>
          <input type="number" step="0.01" min="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder={t('amountEgp')} className="input" required />
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('processing') : t('addBalance')}</button>
        </form>
      </div>
    </div>
  )
}