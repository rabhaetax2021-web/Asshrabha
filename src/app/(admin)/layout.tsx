import React from "react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { cookies, headers } from 'next/headers'

export const metadata = {
  title: "Admin - Asshrabha",
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
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
    // ignore and default to 'ar'
  }

  return (
    <div className="admin-root">
      <AdminSidebar initialLocale={initialLocale} />
      <main className="admin-main">{children}</main>
    </div>
  );
}

