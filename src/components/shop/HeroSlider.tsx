'use client'
import { useEffect, useState } from 'react';
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Slide = {
  id: string
  type?: 'NORMAL' | 'PRODUCT' | 'FUNCTION'
  image?: string
  titleEN?: string
  titleAR?: string
  caption?: string
  productId?: string
  action?: string
}

export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0)
  const [dragStart, setDragStart] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!slides || slides.length === 0) return
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000)
    return () => clearInterval(t)
  }, [slides])

  if (!slides || slides.length === 0) return null

  const current = slides[index]

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
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart === null) return
    const delta = event.clientX - dragStart
    if (Math.abs(delta) > 10) {
      setIsDragging(true)
    }
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStart === null) return
    const delta = event.clientX - dragStart
    setDragStart(null)
    setIsDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)

    if (delta > 40) {
      go(-1)
    } else if (delta < -40) {
      go(1)
    }
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLDivElement>) => {
    setDragStart(null)
    setIsDragging(false)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  // We intentionally render only the banner image for slides and make the
  // slide container itself clickable. No inner overlay or CTA is rendered
  // to avoid obscuring the image with a dark layer.

  const getSlideHref = (s: Slide) => {
    const t = (s.type || '').toString().toUpperCase()
    if (t === 'PRODUCT' && (s.productId || (s as any).targetId)) return `/shop/product/${s.productId || (s as any).targetId}`
    if (t === 'PROVIDER' && (s as any).targetId) return `/shop/store/${(s as any).targetId}`
    if (s.action) return s.action
    return null
  }

  return (
    <div
      className="hero-slider"
      style={{ position: 'relative', overflow: 'hidden', contain: 'layout paint' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      {
        (() => {
          const rawImg = (current as any).image || ''
          // Normalize possible absolute file paths to public path (extract /uploads/...)
          let bg = rawImg
          if (bg && !bg.startsWith('http') && !bg.startsWith('/')) {
            const idx = bg.indexOf('/uploads/')
            if (idx >= 0) bg = bg.slice(idx)
            else {
              // try backslash windows
              const idx2 = bg.indexOf('\\uploads\\')
              if (idx2 >= 0) bg = bg.slice(idx2).replace(/\\/g, '/')
            }
          }
          const href = getSlideHref(current)
          const slideStyle: React.CSSProperties = {
            backgroundImage: `url(${bg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: 220,
            display: 'flex',
            alignItems: 'center',
            color: 'white',
          }

          const label = (current as any).titleEN || (current as any).titleAR || (current as any).caption || ''
          const caption = (current as any).caption || ''

          if (href) {
            return (
              <>
                <Link href={href} className="hero-slide" style={slideStyle} aria-label={label}></Link>
                {caption ? <div className="hero-caption">{caption}</div> : null}
              </>
            )
          }

          return (
            <>
              <div className="hero-slide" style={slideStyle} role="img" aria-label={label} />
              {caption ? <div className="hero-caption">{caption}</div> : null}
            </>
          )
        })()
      }

      <button aria-label="prev" onClick={() => go(-1)} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>‹</button>
      <button aria-label="next" onClick={() => go(1)} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', zIndex: 3 }}>›</button>
    </div>
  )
}
