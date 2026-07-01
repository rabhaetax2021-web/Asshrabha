"use client"

import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import PWAInstallPrompt from '@/components/ui/PWAInstallPrompt'

export default function ClientBootstrap() {
  return (
    <>
      <ServiceWorkerRegister />
      <PWAInstallPrompt />
    </>
  )
}
