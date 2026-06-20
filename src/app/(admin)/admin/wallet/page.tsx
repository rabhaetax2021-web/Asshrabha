import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function AdminWalletPage() {
  const wallets = await prisma.wallet.findMany({ take: 100, orderBy: { updatedAt: 'desc' } })

  return (
    <section className="admin-wallet container">
      <h1>Wallets</h1>
      <table>
        <thead><tr><th>User</th><th>Available</th><th>Pending</th></tr></thead>
        <tbody>
          {wallets.map(w => (
            <tr key={w.id}>
              <td>{w.userId}</td>
              <td>{w.availableBalance}</td>
              <td>{w.pendingBalance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
