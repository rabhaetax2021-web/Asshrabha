import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import RequestsList from '@/components/admin/RequestsList'

export default async function ProviderWithdrawRequestsPage() {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return <div>Forbidden</div>

  const requests = await prisma.withdrawRequest.findMany({
    where: { wallet: { user: { role: 'PROVIDER' } } },
    orderBy: { createdAt: 'desc' },
    include: { wallet: { include: { user: true } } },
    take: 200,
  })

  return (
    <section className="admin-page container">
      <h1>Provider Withdraw Requests</h1>
      <RequestsList initial={requests} type="withdraw" />
    </section>
  )
}
