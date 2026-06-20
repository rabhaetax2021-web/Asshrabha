"use client"
import React from 'react'
import { useTranslations } from 'next-intl'

type CategoryOption = { id: string; nameEN?: string | null; nameAR?: string | null }

export default function NewProductForm({ categories }: { categories: CategoryOption[] }) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || '')
  const [nameEN, setNameEN] = React.useState('')
  const [nameAR, setNameAR] = React.useState('')
  const [descriptionEN, setDescriptionEN] = React.useState('')
  const [descriptionAR, setDescriptionAR] = React.useState('')
  const [minPrice, setMinPrice] = React.useState('')
  const [maxPrice, setMaxPrice] = React.useState('')
  const [wholesaleMinPrice, setWholesaleMinPrice] = React.useState('')
  const [wholesaleMaxPrice, setWholesaleMaxPrice] = React.useState('')
  const [retailMinPrice, setRetailMinPrice] = React.useState('')
  const [retailMaxPrice, setRetailMaxPrice] = React.useState('')
  const [unitRanges, setUnitRanges] = React.useState<{unitType: string; minPrice: string; maxPrice: string}[]>([
    { unitType: 'PIECE', minPrice: '', maxPrice: '' },
    { unitType: 'BOX', minPrice: '', maxPrice: '' },
    { unitType: 'PACK', minPrice: '', maxPrice: '' },
  ])
  const [images, setImages] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload: any = { categoryId, nameEN, nameAR, descriptionEN, descriptionAR, minimumPrice: Number(minPrice), maximumPrice: Number(maxPrice), images }
      payload.wholesaleMinPrice = Number(wholesaleMinPrice || minPrice)
      payload.wholesaleMaxPrice = Number(wholesaleMaxPrice || maxPrice)
      payload.retailMinPrice = Number(retailMinPrice || 0)
      payload.retailMaxPrice = Number(retailMaxPrice || 0)
      // include unit ranges
      payload.unitRanges = unitRanges.map(u => ({ unitType: u.unitType, minPrice: Number(u.minPrice || 0), maxPrice: Number(u.maxPrice || 0) }))
      const res = await fetch('/api/admin/catalog-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      window.location.href = '/admin/catalog'
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <label>{t('selectCategory')}</label>
        <select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.nameEN || c.nameAR}</option>
          ))}
        </select>
      </div>
      <div className="form-row">
        <label>{t('productNameEN')}</label>
        <input value={nameEN} onChange={e => setNameEN(e.target.value)} />
      </div>
      <div className="form-row">
        <label>{t('productNameAR')}</label>
        <input value={nameAR} onChange={e => setNameAR(e.target.value)} />
      </div>
      <div className="form-row">
        <label>{t('minimumPrice')}</label>
        <input value={minPrice} onChange={e => setMinPrice(e.target.value)} type="number" step="0.01" />
      </div>
      <div className="form-row">
        <label>{t('maximumPrice')}</label>
        <input value={maxPrice} onChange={e => setMaxPrice(e.target.value)} type="number" step="0.01" />
      </div>
      <div className="form-row">
        <label>Wholesale Min Price</label>
        <input value={wholesaleMinPrice} onChange={e => setWholesaleMinPrice(e.target.value)} type="number" step="0.01" placeholder={minPrice || 'auto'} />
      </div>
      <div className="form-row">
        <label>Wholesale Max Price</label>
        <input value={wholesaleMaxPrice} onChange={e => setWholesaleMaxPrice(e.target.value)} type="number" step="0.01" placeholder={maxPrice || 'auto'} />
      </div>
      <div className="form-row">
        <label>Retail Min Price</label>
        <input value={retailMinPrice} onChange={e => setRetailMinPrice(e.target.value)} type="number" step="0.01" />
      </div>
      <div className="form-row">
        <label>Retail Max Price</label>
        <input value={retailMaxPrice} onChange={e => setRetailMaxPrice(e.target.value)} type="number" step="0.01" />
      </div>
      <div className="form-row">
        <label>Unit Price Ranges</label>
        <div style={{ display: 'grid', gap: 8 }}>
          {unitRanges.map((u, idx) => (
            <div key={u.unitType} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ minWidth: 80 }}>{u.unitType}</div>
              <input placeholder="min" type="number" step="0.01" value={u.minPrice} onChange={e => setUnitRanges(prev => prev.map((p, i) => i === idx ? { ...p, minPrice: e.target.value } : p))} />
              <input placeholder="max" type="number" step="0.01" value={u.maxPrice} onChange={e => setUnitRanges(prev => prev.map((p, i) => i === idx ? { ...p, maxPrice: e.target.value } : p))} />
            </div>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label>{t('descriptionEN')}</label>
        <textarea value={descriptionEN} onChange={e => setDescriptionEN(e.target.value)} />
      </div>
      <div className="form-row">
        <label>{t('descriptionAR')}</label>
        <textarea value={descriptionAR} onChange={e => setDescriptionAR(e.target.value)} />
      </div>
      <div className="form-row">
        <label>{t('productImages')}</label>
        <input type="file" accept="image/*" multiple onChange={async (e) => {
          const files = Array.from(e.target.files || [])
          if (files.length === 0) return
          setLoading(true)
          try {
            for (const f of files) {
              const fd = new FormData()
              fd.append('file', f)
              const r = await fetch('/api/upload', { method: 'POST', body: fd })
              if (!r.ok) continue
              const j = await r.json()
              const p = j?.path || j?.data?.path || null
              if (p) setImages(prev => [...prev, p])
            }
          } catch (err) {
            console.error('upload images', err)
          } finally {
            setLoading(false)
          }
        }} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative' }}>
              <img src={img} alt={`img-${idx}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 6 }} />
              <button type="button" onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', right: 2, top: 2 }}>✕</button>
            </div>
          ))}
        </div>
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={loading}>{loading ? tc('loading') : t('createProduct')}</button>
      </div>
    </form>
  )
}
