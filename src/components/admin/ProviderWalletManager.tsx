'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

type ProviderWallet = {
  id: string
  userId: string
  availableBalance: number
  pendingBalance: number
  isFrozen?: boolean
  transactions?: Array<{ id: string; amount: number; type: string; status: string; createdAt: string }>
}

type ProviderOption = {
  id: string
  nameEN?: string | null
  nameAR?: string | null
  mobile?: string | null
  wallet?: ProviderWallet | null
}

export default function ProviderWalletManager({ providers }: { providers: ProviderOption[] }) {
  const t = useTranslations('admin')
  const [selectedUserId, setSelectedUserId] = useState<string>(providers[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit')
  const [loading, setLoading] = useState(false)
  const [wallets, setWallets] = useState<Record<string, ProviderWallet | null>>(() => Object.fromEntries(providers.map((p) => [p.id, p.wallet || null])))

  const selectedProvider = useMemo(() => providers.find((p) => p.id === selectedUserId) || providers[0], [providers, selectedUserId])
  const wallet = wallets[selectedProvider?.id || ''] || null

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProvider?.id) return

    const val = Number(amount)
    if (!val || val <= 0) {
      showToast(t('enterValidAmount'), 'error')
      return
    }

    if (mode === 'withdraw' && wallet && val > Number(wallet.availableBalance)) {
      showToast(t('insufficientBalance'), 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/wallet/providers/${selectedProvider.id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val, action: mode }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t('failed'))

      setWallets((prev) => ({ ...prev, [selectedProvider.id]: data.wallet || prev[selectedProvider.id] }))
      setAmount('')
      showToast(mode === 'deposit' ? t('balanceAdded') : t('withdrawalApplied'), 'success')
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: 'var(--space-6)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'end', marginBottom: 'var(--space-6)' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          <label className="label" htmlFor="provider-wallet-select">{t('provider')}</label>
          <select id="provider-wallet-select" className="input" value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>{p.nameEN || p.nameAR || p.mobile || p.id}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button type="button" className={mode === 'deposit' ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => setMode('deposit')}>{t('addBalance')}</button>
          <button type="button" className={mode === 'withdraw' ? 'btn btn-primary' : 'btn btn-ghost'} onClick={() => setMode('withdraw')}>{t('withdraw')}</button>
        </div>
      </div>

      <div className="wallet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="wallet-card card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="wallet-label" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>{t('availableBalance')}</div>
          <div className="wallet-balance" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>{wallet ? Number(wallet.availableBalance).toFixed(2) : '0.00'} EGP</div>
        </div>
        <div className="wallet-card card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="wallet-label" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>{t('pendingBalance')}</div>
          <div className="wallet-balance" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--warning-dark)' }}>{wallet ? Number(wallet.pendingBalance).toFixed(2) : '0.00'} EGP</div>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
        <input type="number" step="0.01" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={t('amountEgp')} className="input" style={{ flex: 1 }} required />
        <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('processing') : mode === 'deposit' ? t('add') : t('withdraw')}</button>
      </form>

      <div>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>{t('history')}</h3>
        {wallet?.transactions?.length ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {wallet.transactions.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)' }}>{tx.type}</div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: tx.type === 'DEPOSIT' || tx.type === 'ORDER_CREDIT' || tx.type === 'REFUND' ? 'var(--success-dark)' : 'var(--text-primary)' }}>
                    {tx.type === 'DEPOSIT' || tx.type === 'ORDER_CREDIT' || tx.type === 'REFUND' ? '+' : '-'}{Number(tx.amount).toFixed(2)} EGP
                  </div>
                  <div style={{ fontSize: 'var(--text-2xs)' }}>
                    <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : tx.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: 'var(--text-2xs)' }}>{tx.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>{t('noTransactions')}</p>
        )}
      </div>
    </div>
  )
}
