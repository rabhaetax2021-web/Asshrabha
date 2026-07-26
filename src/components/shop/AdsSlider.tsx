'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'

type Slide = {
  id: string
  type?: 'NORMAL' | 'PRODUCT' | 'FUNCTION' | string
  image?: string
  titleEN?: string
  titleAR?: string
  caption?: string
  productId?: string
  action?: string
  targetId?: string
  visible?: boolean
}

const isVideoUrl = (value?: string) => {
  if (!value) return false
  return /\.(mp4|webm|ogg|mov)(?:\?.*)?$/i.test(value)
}

export default function AdsSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        setIsVisible(entry.isIntersecting && entry.intersectionRatio > 0.5)
      },
      { threshold: [0.5], rootMargin: '0px' }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible || slides.length === 0) return

    const currentSlide = slides[index]
    if (isVideoUrl(currentSlide?.image)) {
      return
    }

    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 5000)
    return () => window.clearInterval(timer)
  }, [isVisible, index, slides])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (!isVisible) {
      video.pause()
      return
    }

    video.currentTime = 0
    video.play().catch(() => {
      // ignore autoplay restrictions
    })

    const handleEnded = () => {
      setIndex((i) => (i + 1) % slides.length)
    }

    video.addEventListener('ended', handleEnded)
    return () => {
      video.removeEventListener('ended', handleEnded)
    }
  }, [isVisible, index, slides.length])

  if (!slides || slides.length === 0) return null

  const current = slides[index]
  const rawImg = current.image || ''
  let bg = rawImg
  if (bg && !bg.startsWith('http') && !bg.startsWith('/')) {
    const idx = bg.indexOf('/uploads/')
    if (idx >= 0) bg = bg.slice(idx)
    else {
      const idx2 = bg.indexOf('\\uploads\\')
      if (idx2 >= 0) bg = bg.slice(idx2).replace(/\\/g, '/')
    }
  }

  const href = (() => {
    const t = (current.type || '').toString().replace(/^ads-/i, '').toUpperCase()
    if (t === 'PRODUCT' && (current.productId || current.targetId)) return `/shop/product/${current.productId || current.targetId}`
    if (t === 'PROVIDER' && current.targetId) return `/shop/store/${current.targetId}`
    if (current.action) return current.action
    return null
  })()

  const slideStyle: React.CSSProperties = {
    backgroundImage: isVideoUrl(bg) ? undefined : `url(${bg})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    minHeight: 220,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    position: 'relative',
  }

  const label = current.titleEN || current.titleAR || current.caption || ''
  const caption = current.caption || ''

  const go = (dir: number) => {
    setIndex((i) => {
      const next = i + dir
      if (next < 0) return slides.length - 1
      if (next >= slides.length) return 0
      return next
    })
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragStart(event.clientX)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart === null) return
    const delta = event.clientX - dragStart
    if (Math.abs(delta) > 10) {
      event.preventDefault()
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart === null) return
    const delta = event.clientX - dragStart
    setDragStart(null)
    event.currentTarget.releasePointerCapture(event.pointerId)
    if (delta > 40) go(-1)
    else if (delta < -40) go(1)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragStart(null)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div
      ref={containerRef}
      className="hero-slider"
      style={{ position: 'relative', overflow: 'hidden', contain: 'layout paint' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {href ? (
        <Link href={href} className="hero-slide" style={slideStyle} aria-label={label}>
          {isVideoUrl(bg) ? (
            <video
              ref={videoRef}
              src={bg}
              muted
              playsInline
              loop
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </Link>
      ) : (
        <div className="hero-slide" style={slideStyle} role="img" aria-label={label}>
          {isVideoUrl(bg) ? (
            <video
              ref={videoRef}
              src={bg}
              muted
              playsInline
              loop
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </div>
      )}

      {caption ? <div className="hero-caption">{caption}</div> : null}

      <button aria-label="prev" onClick={() => go(-1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>‹</button>
      <button aria-label="next" onClick={() => go(1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>›</button>
    </div>
  )
}
