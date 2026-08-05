"use client"
import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const hostname = window.location.hostname
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
    const shouldRegister = process.env.NODE_ENV === 'production' || isLocalHost

    if (!shouldRegister) {
      return
    }

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              // Ignore state changes; the install flow is handled by the browser.
            })
          }
        })
      })
      .catch(() => {
        // Ignore registration errors in unsupported environments.
      })
  }, [])

  return null
}
