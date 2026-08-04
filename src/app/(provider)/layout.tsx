import React from "react";
import ProviderSidebar from "@/components/layout/ProviderSidebar";
import Topbar from '@/components/ui/Topbar'
import { cookies, headers } from 'next/headers'

export const metadata = {
  title: "Provider - Ashrabha",
};

export default async function ProviderRootLayout({ children }: { children: React.ReactNode }) {
  let initialLocale: 'ar' | 'en' = 'ar'
  try {
    const cookieStore = await cookies()
    const getFn = (cookieStore as { get?: (name: string) => { value?: string } })?.get
    if (typeof getFn === 'function') {
      initialLocale = (getFn('NEXT_LOCALE')?.value as 'ar' | 'en') || initialLocale
    } else {
      const cookieHeader = (await headers()).get('cookie') || ''
      const m = cookieHeader.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
      if (m) initialLocale = decodeURIComponent(m[1]) as 'ar' | 'en'
    }
  } catch (e) {
    // ignore and keep default
  }

  return (
    <div className="provider-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <ProviderSidebar initialLocale={initialLocale} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar />
        <main className="provider-main">{children}</main>
      </div>
    </div>
  );
}

