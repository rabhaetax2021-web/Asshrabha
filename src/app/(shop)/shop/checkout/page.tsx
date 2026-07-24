import React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import CheckoutClient from '@/components/shop/CheckoutClient'

export default async function CheckoutPage() {
  const current = await getCurrentUser()
  const locale = await getLocale()
  const messages = await getMessages()

  if (!current) return <div className="container" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Please login</div>

  // Fetch user addresses for selection
  const addresses = await prisma.address.findMany({
    where: { userId: current.id },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  })

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <CheckoutClient addresses={addresses} userId={current.id} />
    </NextIntlClientProvider>
  )
}
