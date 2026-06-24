"use client"
import React, { useState, useEffect } from 'react'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function WalletClient({ wallet, transactions }: { wallet: any; transactions: any[] }) {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [methods, setMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const resm = await fetch('/api/admin/wallet/payment-methods')
        if (resm.ok) {
          const jm = await resm.json()
          setMethods(jm.methods || [])
        }
      } catch (e) {}
    })()
  }, [])

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const val = Number(amount)
    if (!val || val <= 0) {
      showToast('Enter a valid amount', 'error')
      return
    }
    if (!selectedMethod) {
      showToast('Please choose a payment method', 'error')
      return
    }
    // Open confirmation modal instead of sending immediately
    setPendingAmount(val)
    setShowConfirm(true)
    return
  }

  async function confirmDeposit() {
    if (!pendingAmount || !selectedMethod) return
    setLoading(true)
    try {
      const res = await fetch('/api/shop/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: pendingAmount, methodId: selectedMethod })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      showToast('Deposit request submitted (pending approval)', 'success')
      setAmount('')
      setPendingAmount(null)
      setSelectedMethod(null)
      setShowConfirm(false)
      window.location.reload()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  function cancelConfirm() {
    setShowConfirm(false)
    setPendingAmount(null)
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
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 'var(--space-4)' }}>
        <button className="btn btn-primary" onClick={() => setActiveTab('deposit')}>Add Balance</button>
      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
          <div style={{ width: 520, background: 'white', borderRadius: 8, padding: 'var(--space-6)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>Confirm Deposit</h3>
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Amount</div>
              <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)' }}>{pendingAmount?.toFixed(2)} EGP</div>
            </div>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Payment Method</div>
              <div style={{ fontWeight: 'var(--font-semibold)' }}>{methods.find(m => m.id === selectedMethod)?.name || 'Selected Method'}</div>
              <div style={{ marginTop: 'var(--space-2)', color: 'var(--text-muted)' }}>{methods.find(m => m.id === selectedMethod)?.instructions}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={cancelConfirm} disabled={loading}>Keep Editing</button>
              <button className="btn btn-primary" onClick={confirmDeposit} disabled={loading}>{loading ? 'Processing...' : 'Confirm Payment'}</button>
            </div>
          </div>
        </div>
      )}
        <button className="btn btn-ghost" onClick={() => setActiveTab('withdraw')}>Withdraw</button>
      </div>
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
            {activeTab === 'deposit' && (
              <select value={selectedMethod || ''} onChange={e => setSelectedMethod(e.target.value)} style={{ width: 240 }}>
                <option value="">Choose payment method</option>
                {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            )}
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
