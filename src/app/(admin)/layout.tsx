import React from 'react'
import AdminSidebar from '@/components/layout/AdminSidebar'
import MobileHeader from '@/components/ui/MobileHeader'
import Topbar from '@/components/ui/Topbar'
import ThemeProvider from '@/components/ui/ThemeProvider'
import ErrorRecovery from '@/components/ErrorRecovery'
import { cookies, headers } from 'next/headers'
import '../globals.css'

export const metadata = {
  title: 'Admin - Asshrabha',
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
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
    // ignore and default to 'ar'
  }

  return (
    <ThemeProvider>
      <div className="admin-root" style={{ display: 'flex', minHeight: '100vh' }}>
        <ErrorRecovery />
        <MobileHeader />
        <AdminSidebar initialLocale={initialLocale} />
        <div style={{ flex: 1 }}>
          <Topbar />
          <main className="admin-main">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  )
}

