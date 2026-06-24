import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProviderDeliveryAreasClient from '@/components/provider/ProviderDeliveryAreasClient'

export default async function DeliveryAreasPage() {
  const current = await getCurrentUser()
  if (!current || current.role !== 'PROVIDER') {
    return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Please sign in as a provider to manage delivery areas.</div>
  }

  const provider = await prisma.providerProfile.findFirst({ where: { userId: current.id }, select: { id: true } })
  if (!provider) {
    return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Provider profile not found.</div>
  }

  return (
    <section className="provider-delivery-areas container">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        <h1>Delivery Areas</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 760 }}>Add or remove the governorates where your store delivers. Shops will only see your store when their delivery address matches one of these active areas.</p>
      </div>
      <ProviderDeliveryAreasClient />
    </section>
  )
}
