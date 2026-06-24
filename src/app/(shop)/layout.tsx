import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import FooterTabs from '@/components/shop/FooterTabs'
import MobileHeader from '@/components/ui/MobileHeader'
import CartPopup from '@/components/shop/CartPopup'
import { getCurrentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const current = await getCurrentUser()
  const isShop = current?.role === 'PROVIDER'

  return {
    title: 'Shop - Asshrabha',
    viewport: isShop
      ? {
          width: 'device-width',
          initialScale: 1,
          minimumScale: 1,
          maximumScale: 1,
          userScalable: false,
        }
      : undefined,
  }
}

export default function ShopRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shop-root">
      <MobileHeader />
      <main className="shop-main">{children}</main>
      <FooterTabs />
      <CartPopup />
    </div>
  )
}

