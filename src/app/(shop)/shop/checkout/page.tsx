import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CheckoutClient from '@/components/shop/CheckoutClient'

export default async function CheckoutPage() {
  const current = await getCurrentUser()
  if (!current) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Please login</div>

  // Fetch user addresses for selection
  const addresses = await prisma.address.findMany({
    where: { userId: current.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return <CheckoutClient addresses={addresses} userId={current.id} />
}
