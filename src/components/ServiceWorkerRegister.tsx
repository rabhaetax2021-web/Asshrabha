"use client"
import { useEffect } from 'react'

// No service worker registration for this app. If one is already installed,
// unregister it to avoid stale caching and orphaned admin SW requests.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => {})
        })
      }).catch(() => {})
    }
  }, [])

  return null
}
