import React from 'react'
import type { Metadata, Viewport } from 'next'
import Link from 'next/link'
import FooterTabs from '@/components/shop/FooterTabs'
import MobileHeader from '@/components/ui/MobileHeader'
import CartPopup from '@/components/shop/CartPopup'
import ShopPullToRefresh from '@/components/shop/ShopPullToRefresh'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Shop - Asshrabha',
  }
}

export function generateViewport(): Viewport {
  return {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function ShopRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ShopPullToRefresh>
      <div className="shop-root">
        <MobileHeader />
        <main className="shop-main">{children}</main>
        <FooterTabs />
        <CartPopup />
      </div>
    </ShopPullToRefresh>
  )
}

