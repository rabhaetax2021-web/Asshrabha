"use client"

import { useEffect, useRef } from 'react'

export default function ShopPullToRefresh({ children }: { children: React.ReactNode }) {
  const startYRef = useRef<number | null>(null)
  const pullDetectedRef = useRef(false)
  const reloadingRef = useRef(false)

  useEffect(() => {
    const threshold = 80

    const onTouchStart = (event: TouchEvent) => {
      if (window.scrollY > 0) return
      if (event.touches.length !== 1) return
      startYRef.current = event.touches[0].clientY
      pullDetectedRef.current = false
    }

    const onTouchMove = (event: TouchEvent) => {
      const startY = startYRef.current
      if (startY === null || event.touches.length !== 1) return
      const deltaY = event.touches[0].clientY - startY
      if (deltaY > threshold && window.scrollY <= 0) {
        pullDetectedRef.current = true
      } else if (deltaY < 0) {
        pullDetectedRef.current = false
      }
    }

    const onTouchEnd = () => {
      if (pullDetectedRef.current && window.scrollY <= 0 && !reloadingRef.current) {
        reloadingRef.current = true
        window.location.reload()
      }
      startYRef.current = null
      pullDetectedRef.current = false
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  return <div className="shop-pull-to-refresh">{children}</div>
}
