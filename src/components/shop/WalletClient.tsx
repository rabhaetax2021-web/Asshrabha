"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'

export default function WalletClient({ wallet, transactions }: { wallet: any; transactions: any[] }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const val = Number(amount)
    if (!val || val <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/shop/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      showToast('Deposit successful', 'success')
      setAmount('')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    const val = Number(amount)
    if (!val || val <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    if (val > wallet.availableBalance) {
      showToast('Insufficient balance', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/shop/wallet/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: val })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      showToast('Withdrawal request submitted', 'success')
      setAmount('')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="wallet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="wallet-card card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="wallet-label" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Available Balance</div>
          <div className="wallet-balance" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>{Number(wallet.availableBalance).toFixed(2)} EGP</div>
        </div>
        <div className="wallet-card card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="wallet-label" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>Pending Balance</div>
          <div className="wallet-balance" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--warning-dark)' }}>{Number(wallet.pendingBalance).toFixed(2)} EGP</div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-3)' }}>
          <button
            type="button"
            className={activeTab === 'deposit' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveTab('deposit')}
          >Add Money</button>
          <button
            type="button"
            className={activeTab === 'withdraw' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveTab('withdraw')}
          >Withdraw</button>
        </div>

        <form onSubmit={activeTab === 'deposit' ? handleDeposit : handleWithdraw}>
          <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount (EGP)"
              className="input"
              style={{ flex: 1 }}
              required
            />
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : activeTab === 'deposit' ? 'Add' : 'Withdraw'}
            </button>
          </div>
        </form>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Transaction History</h3>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {transactions.map((tx: any) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 'var(--font-semibold)', fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{tx.type}</div>
                  <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>{new Date(tx.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-sm)', color: tx.type === 'DEPOSIT' || tx.type === 'ORDER_CREDIT' || tx.type === 'REFUND' ? 'var(--success-dark)' : 'var(--text-primary)' }}>
                    {tx.type === 'DEPOSIT' || tx.type === 'ORDER_CREDIT' || tx.type === 'REFUND' ? '+' : '-'}{tx.amount.toFixed(2)} EGP
                  </div>
                  <div style={{ fontSize: 'var(--text-2xs)' }}>
                    <span className={`badge ${tx.status === 'COMPLETED' ? 'badge-success' : tx.status === 'PENDING' ? 'badge-warning' : 'badge-error'}`} style={{ fontSize: 'var(--text-2xs)' }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
