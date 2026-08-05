"use client"
import { useEffect } from 'react'

// No service worker registration for this app. If one is already installed,
// unregister it to avoid stale caching and orphaned admin SW requests.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) {
      return
    }

    {
      // Register the application's service worker to enable PWA features.
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Optionally listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                // You can add logic here to notify users about updates
              })
            }
          })
        })
        .catch(() => {
          // Ignore registration errors in dev or unsupported environments
        })
    }
  }, [])

  return null
}
