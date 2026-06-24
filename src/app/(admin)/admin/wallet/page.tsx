import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function AdminWalletPage() {
  const wallets = await prisma.wallet.findMany({ take: 100, orderBy: { updatedAt: 'desc' } })

  return (
    <section className="admin-wallet container">
      <h1>Wallets</h1>
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead><tr><th>User</th><th>Available</th><th className="hide-sm">Pending</th></tr></thead>
          <tbody>
            {wallets.map(w => (
              <tr key={w.id}>
                <td>{w.userId}</td>
                <td>{w.availableBalance}</td>
                <td className="hide-sm">{w.pendingBalance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
