"use client"

import React, { useEffect } from 'react'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export default function ClientBootstrap() {
  useEffect(() => {
    try {
      const main = document.querySelector('main') || document.querySelector('div[role="main"]')
      if (main && !main.id) main.id = '__a11y_main'
      if (main) main.tabIndex = -1

      const root = document.documentElement
      root.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top, 0px)')
      root.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom, 0px)')
      root.style.setProperty('--safe-area-inset-left', 'env(safe-area-inset-left, 0px)')
      root.style.setProperty('--safe-area-inset-right', 'env(safe-area-inset-right, 0px)')

      document.body.style.minHeight = '100dvh'
      document.body.style.overscrollBehavior = 'none'
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <>
      <ServiceWorkerRegister />
    </>
  )
}
