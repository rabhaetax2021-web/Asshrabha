import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import ManageAddressesClient from '@/components/shop/ManageAddressesClient'

export default async function ManageAddressesPage() {
  const current = await getCurrentUser()
  const t = await getTranslations('shop')

  if (!current) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>{t('pleaseLogin')}</div>

  const addresses = await prisma.address.findMany({
    where: { userId: current.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <section className="container" style={{ padding: 'var(--space-6) 0 var(--space-10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>{t('manageAddressesTitle')}</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{t('manageAddressesSubtitle')}</p>
        </div>
        <Link href="/shop/profile" className="btn btn-ghost">{t('backToProfile')}</Link>
      </div>

      <ManageAddressesClient initialAddresses={addresses} />
    </section>
  )
}
