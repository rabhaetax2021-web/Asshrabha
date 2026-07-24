"use client"

import React, { useEffect } from 'react'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export default function ClientBootstrap() {
  // Client-side bootstrap: service worker and accessibility helpers
  useEffect(() => {
    try {
      const main = document.querySelector('main') || document.querySelector('div[role="main"]')
      if (main && !main.id) main.id = '__a11y_main'
      // Make the main focusable for skip-link
      if (main) main.tabIndex = -1
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
