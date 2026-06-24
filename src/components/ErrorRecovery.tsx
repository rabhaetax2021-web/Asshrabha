"use client"
import { useEffect } from 'react'

export default function ErrorRecovery() {
  useEffect(() => {
    function onError(e: ErrorEvent) {
      try {
        const msg = (e && (e.error?.message || e.message || '')).toString()
        if (msg.includes('ChunkLoadError') || msg.includes('Loading chunk')) {
          // Attempt a full reload to recover from a broken HMR/chunk state
          console.warn('Chunk load error detected, reloading page to recover')
          window.location.reload()
        }
      } catch (err) {
        // ignore
      }
    }

    function onUnhandledRejection(ev: PromiseRejectionEvent) {
      try {
        const reason = String(ev.reason || '')
        if (reason.includes('ChunkLoadError') || reason.includes('Loading chunk')) {
          console.warn('Unhandled rejection with chunk load error, reloading')
          window.location.reload()
        }
      } catch (err) {}
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
