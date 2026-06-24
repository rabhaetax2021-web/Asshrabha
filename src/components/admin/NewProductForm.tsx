"use client"
import React from 'react'
import { useTranslations } from 'next-intl'
import { getErrorMessage } from '@/lib/errors'

type CategoryOption = { id: string; nameEN?: string | null; nameAR?: string | null }

export default function NewProductForm({ categories, initial }: { categories: CategoryOption[]; initial?: any }) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const [categoryId, setCategoryId] = React.useState(categories[0]?.id || '')
  const [nameEN, setNameEN] = React.useState('')
  const [nameAR, setNameAR] = React.useState('')
  const [descriptionEN, setDescriptionEN] = React.useState('')
  const [descriptionAR, setDescriptionAR] = React.useState('')
  const [wholesaleMinPrice, setWholesaleMinPrice] = React.useState('')
  const [wholesaleMaxPrice, setWholesaleMaxPrice] = React.useState('')
  const [retailMinPrice, setRetailMinPrice] = React.useState('')
  const [retailMaxPrice, setRetailMaxPrice] = React.useState('')
  const [unitType, setUnitType] = React.useState('PIECE')
  const [images, setImages] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const wholesaleMin = Number(wholesaleMinPrice)
      const wholesaleMax = Number(wholesaleMaxPrice)
      const retailMin = Number(retailMinPrice)
      const retailMax = Number(retailMaxPrice)
      if (wholesaleMin > wholesaleMax) throw new Error('Wholesale min price must be less than or equal to wholesale max price')
      if (retailMin > retailMax) throw new Error('Retail min price must be less than or equal to retail max price')

      const payload: Record<string, unknown> = {
        categoryId,
        nameEN,
        nameAR,
        descriptionEN,
        descriptionAR,
        wholesaleMinPrice: wholesaleMin,
        wholesaleMaxPrice: wholesaleMax,
        retailMinPrice: retailMin,
        retailMaxPrice: retailMax,
        images,
        unitType,
      }
      const method = initial?.id ? 'PATCH' : 'POST'
      const url = initial?.id ? `/api/admin/catalog-products/${initial.id}` : '/api/admin/catalog-products'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      window.location.href = '/admin/catalog'
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  // populate initial values when editing
  React.useEffect(() => {
    if (!initial) return
    setCategoryId(initial.categoryId || categories[0]?.id || '')
    setNameEN(initial.nameEN || '')
    setNameAR(initial.nameAR || '')
    setDescriptionEN(initial.descriptionEN || '')
    setDescriptionAR(initial.descriptionAR || '')
    setWholesaleMinPrice(String(initial.wholesaleMinPrice || ''))
    setWholesaleMaxPrice(String(initial.wholesaleMaxPrice || ''))
    setRetailMinPrice(String(initial.retailMinPrice || ''))
    setRetailMaxPrice(String(initial.retailMaxPrice || ''))
    setUnitType(initial.unitType || 'PIECE')
    setImages(initial.images || [])
  }, [initial, categories])

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
      <div className="form-row" style={{ display: 'grid', gap: 8 }}>
        <label>Wholesale Price Range</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Min" value={wholesaleMinPrice} onChange={e => setWholesaleMinPrice(e.target.value)} type="number" step="0.01" required />
          <input placeholder="Max" value={wholesaleMaxPrice} onChange={e => setWholesaleMaxPrice(e.target.value)} type="number" step="0.01" required />
        </div>
      </div>
      <div className="form-row" style={{ display: 'grid', gap: 8 }}>
        <label>Retail Price Range</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Min" value={retailMinPrice} onChange={e => setRetailMinPrice(e.target.value)} type="number" step="0.01" required />
          <input placeholder="Max" value={retailMaxPrice} onChange={e => setRetailMaxPrice(e.target.value)} type="number" step="0.01" required />
        </div>
      </div>
      <div className="form-row">
        <label>Unit</label>
        <select value={unitType} onChange={e => setUnitType(e.target.value)}>
          <option value="BOX">Box - كرتونة</option>
          <option value="PACK">Pack - باكيت</option>
          <option value="PIECE">Piece - قطعة</option>
        </select>
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
          } catch (err: unknown) {
            console.error('upload images', getErrorMessage(err))
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
