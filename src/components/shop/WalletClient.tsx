"use client"
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function WalletClient({ wallet, transactions }: { wallet?: any; transactions?: any[] }) {
  const t = useTranslations('shop')
  const tc = useTranslations('common')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit')
  const [methods, setMethods] = useState<any[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingAmount, setPendingAmount] = useState<number | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofFileName, setProofFileName] = useState<string>('')
  const [walletState, setWalletState] = useState<any | null>(wallet || null)
  const [transactionsState, setTransactionsState] = useState<any[]>(transactions || [])

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
    if (!wallet) {
      ;(async () => {
        try {
          const r = await fetch('/api/shop/wallet')
          if (r.ok) {
            const j = await r.json()
            if (j.ok) {
              setWalletState(j.wallet)
              setTransactionsState(j.transactions || [])
            }
          }
        } catch (e) {}
      })()
    }
  }, [])

  async function handleDeposit(e: React.FormEvent) {
    e.preventDefault()
    const val = Number(amount)
    if (!val || val <= 0) {
      showToast(t('enterValidAmount'), 'error')
      return
    }
    if (!selectedMethod) {
      showToast(t('choosePaymentMethod'), 'error')
      return
    }
    if (!proofFile) {
      showToast(t('screenshotRequired'), 'error')
      return
    }
    setPendingAmount(val)
    setShowConfirm(true)
    return
  }

  async function confirmDeposit() {
    if (!pendingAmount || !selectedMethod || !proofFile) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('amount', pendingAmount.toString())
      formData.append('methodId', selectedMethod)
      formData.append('proofScreenshot', proofFile)
      
      const res = await fetch('/api/shop/wallet/deposit', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || t('depositFailed'))
      showToast(t('depositSubmitted'), 'success')
      setAmount('')
      setPendingAmount(null)
      setSelectedMethod(null)
      setProofFile(null)
      setProofFileName('')
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
      showToast(t('enterValidAmount'), 'error')
      return
    }
    if (val > (walletState?.availableBalance ?? wallet?.availableBalance ?? 0)) {
      showToast(t('insufficientBalance'), 'error')
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
      if (!res.ok) throw new Error(data?.error || t('withdrawFailed'))
      showToast(t('withdrawSubmitted'), 'success')
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
        <button className="btn btn-primary" onClick={() => setActiveTab('deposit')}>{t('addBalance')}</button>
        {showConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div style={{ width: 520, background: 'white', borderRadius: 8, padding: 'var(--space-6)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h3 style={{ marginTop: 0, marginBottom: 'var(--space-3)' }}>{t('confirmDeposit')}</h3>
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('amount')}</div>
                <div style={{ fontWeight: 'var(--font-bold)', fontSize: 'var(--text-lg)' }}>{pendingAmount?.toFixed(2)} EGP</div>
              </div>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>{t('paymentMethod')}</div>
                <div style={{ fontWeight: 'var(--font-semibold)' }}>{methods.find(m => m.id === selectedMethod)?.name || t('selectedMethod')}</div>
                <div style={{ marginTop: 'var(--space-2)', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{methods.find(m => m.id === selectedMethod)?.instructions}</div>
              </div>
              {proofFileName && (
                <div style={{ marginBottom: 'var(--space-4)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>{t('uploadedFile')}</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)', wordBreak: 'break-word' }}>📎 {proofFileName}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="btn btn-ghost" onClick={cancelConfirm} disabled={loading}>{t('keepEditing')}</button>
                <button className="btn btn-primary" onClick={confirmDeposit} disabled={loading}>{loading ? t('processing') : t('confirmPayment')}</button>
              </div>
            </div>
          </div>
        )}
        <button className="btn btn-ghost" onClick={() => setActiveTab('withdraw')}>{t('withdraw')}</button>
      </div>
      <div className="wallet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <div className="wallet-card card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="wallet-label" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>{t('availableBalance')}</div>
          <div className="wallet-balance" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--primary)' }}>{Number(walletState?.availableBalance ?? wallet?.availableBalance ?? 0).toFixed(2)} EGP</div>
        </div>
        <div className="wallet-card card" style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
          <div className="wallet-label" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>{t('pendingBalance')}</div>
          <div className="wallet-balance" style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', color: 'var(--warning-dark)' }}>{Number(walletState?.pendingBalance ?? wallet?.pendingBalance ?? 0).toFixed(2)} EGP</div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-3)' }}>
          <button
            type="button"
            className={activeTab === 'deposit' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveTab('deposit')}
          >{t('addMoney')}</button>
          <button
            type="button"
            className={activeTab === 'withdraw' ? 'btn btn-primary' : 'btn btn-ghost'}
            onClick={() => setActiveTab('withdraw')}
          >{t('withdraw')}</button>
        </div>

        <form onSubmit={activeTab === 'deposit' ? handleDeposit : handleWithdraw}>
          {activeTab === 'deposit' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={t('amountEgp')}
                  className="input"
                  style={{ flex: 1 }}
                  required
                />
                <select value={selectedMethod || ''} onChange={e => setSelectedMethod(e.target.value)} style={{ width: 240 }}>
                  <option value="">{t('choosePaymentMethod')}</option>
                  {methods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              {selectedMethod && methods.find(m => m.id === selectedMethod)?.instructions && (
                <div style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  fontSize: 'var(--text-sm)',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {methods.find(m => m.id === selectedMethod)?.instructions}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <label style={{ flex: 1, display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-2)', color: 'var(--text-primary)' }}>
                    {t('paymentProofScreenshot')}
                  </span>
                  <div style={{
                    padding: 'var(--space-3)',
                    border: '2px dashed var(--border-light)',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center',
                    background: 'var(--bg-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast) ease'
                  }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        if (e.target.files?.[0]) {
                          setProofFile(e.target.files[0])
                          setProofFileName(e.target.files[0].name)
                        }
                      }}
                      style={{ display: 'none' }}
                      required
                    />
                    <div style={{ color: proofFile ? 'var(--success-dark)' : 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                      {proofFileName ? `📎 ${proofFileName}` : `📷 ${t('selectScreenshot')}`}
                    </div>
                  </div>
                </label>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
                  {loading ? t('processing') : t('add')}
                </button>
              </div>
            </div>
          ) : (
            <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <input
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder={t('amountEgp')}
                className="input"
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('processing') : t('withdraw')}
              </button>
            </div>
          )}
        </form>
      </div>

      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>{t('transactionHistory')}</h3>
        {transactionsState.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>{t('noTransactions')}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {transactionsState.map((tx: any) => (
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
