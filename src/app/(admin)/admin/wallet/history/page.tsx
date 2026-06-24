import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'

export default async function WalletHistoryPage({ searchParams }: { searchParams?: any }) {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return <div>Forbidden</div>

  const q = (searchParams?.q || '').toString().trim()
  const where: any = {}
  if (q) {
    where.OR = [
      { wallet: { user: { mobile: { contains: q, mode: 'insensitive' } } } },
      { reference: { contains: q, mode: 'insensitive' } }
    ]
  }

  const txs = await prisma.walletTransaction.findMany({ where, include: { wallet: { include: { user: true } } }, orderBy: { createdAt: 'desc' }, take: 200 })

  return (
    <section className="admin-page container">
      <h1>Wallet History</h1>
      <form style={{ marginBottom: 12 }} action="/admin/wallet/history" method="get">
        <input name="q" defaultValue={q} placeholder="Search by user mobile or reference" className="input" style={{ width: 320 }} />
        <button className="btn btn-primary" style={{ marginLeft: 8 }}>Search</button>
      </form>
      <div className="card">
        {txs.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No transactions</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {txs.map(t => (
              <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{t.wallet?.user?.mobile} • {t.type}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{t.reference || ''}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700 }}>{t.amount.toFixed(2)} EGP</div>
                  <div style={{ color: 'var(--text-2xs)' }}>{t.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
