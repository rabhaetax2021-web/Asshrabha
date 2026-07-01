import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import PaymentMethodsManager from '@/components/admin/PaymentMethodsManager'

export default async function ProviderPaymentMethodsPage() {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) return <div>Forbidden</div>

  const methods = await (prisma as any).paymentMethod.findMany({ orderBy: { createdAt: 'desc' } })
  return (
    <section className="admin-page container">
      <h1>Provider Payment Methods</h1>
      <PaymentMethodsManager initial={methods} />
    </section>
  )
}
