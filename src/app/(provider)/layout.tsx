import React from "react";
import ProviderSidebar from "@/components/layout/ProviderSidebar";
import { cookies, headers } from 'next/headers'

export const metadata = {
  title: "Provider - Asshrabha",
};

export default async function ProviderRootLayout({ children }: { children: React.ReactNode }) {
  let initialLocale: 'ar' | 'en' = 'ar'
  try {
    const cookieStore = await cookies()
    if (cookieStore && typeof (cookieStore as any).get === 'function') {
      initialLocale = (cookieStore.get('NEXT_LOCALE')?.value as 'ar' | 'en') || initialLocale
    } else {
      const cookieHeader = (await headers()).get('cookie') || ''
      const m = cookieHeader.match(/(?:^|; )NEXT_LOCALE=([^;]+)/)
      if (m) initialLocale = decodeURIComponent(m[1]) as 'ar' | 'en'
    }
  } catch (e) {
    // ignore and keep default
  }

  return (
    <div className="provider-root">
      <ProviderSidebar initialLocale={initialLocale} />
      <main className="provider-main">{children}</main>
    </div>
  );
}

