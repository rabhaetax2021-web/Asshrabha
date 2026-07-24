"use client"

import { useState } from 'react'

export default function ProductGallery({ images, productName }: { images: string[], productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const galleryImages = images.filter(Boolean)

  if (galleryImages.length === 0) {
    return <div className="product-image-placeholder">📦</div>
  }

  const activeImage = galleryImages[activeIndex] || galleryImages[0]

  return (
    <div className="image-gallery">
      <div className="image-gallery-main">
        <img src={activeImage} alt={`${productName} ${activeIndex + 1}`} loading="eager" />
      </div>

      <div className="image-gallery-thumbs" role="list" aria-label="Product photos">
        {galleryImages.map((img, idx) => (
          <button
            key={`${img}-${idx}`}
            type="button"
            className={`image-gallery-thumb ${activeIndex === idx ? 'image-gallery-thumb-active' : ''}`}
            onClick={() => setActiveIndex(idx)}
            aria-label={`View product photo ${idx + 1}`}
            aria-pressed={activeIndex === idx}
          >
            <img src={img} alt={`${productName} ${idx + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  )
}
