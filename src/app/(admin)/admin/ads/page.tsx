'use client'

import React, { useEffect, useState } from 'react'

type Slide = {
  id?: string
  image?: string
  type?: string
  targetId?: string
  caption?: string
  amount?: number
  visible?: boolean
}

export default function AdminAdsPage() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [type, setType] = useState('ads-custom')
  const [targetId, setTargetId] = useState('')
  const [adAmount, setAdAmount] = useState<number | ''>('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    fetchSlides()
  }, [])

  async function fetchSlides() {
    try {
      const res = await fetch('/api/admin/ads')
      if (!res.ok) return
      const data = await res.json()
      setSlides(Array.isArray(data.slides) ? data.slides : [])
    } catch (err) {
      console.error('fetchSlides', err)
    }
  }

  async function uploadFile(f: File) {
    return uploadFileToStorage(f, 'uploads')
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let imagePath = ''
      if (file) {
        const p = await uploadFile(file)
        imagePath = p || ''
      }
      const payload = {
        type,
        targetId: targetId || null,
        caption: caption || null,
        image: imagePath || null,
        amount: type === 'ads-wallet' ? (adAmount || null) : null,
      }
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', slide: payload }),
      })
      if (!res.ok) throw new Error(await res.text())
      setCaption('')
      setTargetId('')
      setType('ads-custom')
      setFile(null)
      setAdAmount('')
      await fetchSlides()
    } catch (err) {
      console.error(err)
      alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id || !confirm('Delete this ad slide?')) return
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', slide: { id } }),
      })
      if (res.ok) await fetchSlides()
    } catch (err) {
      console.error('delete', err)
    }
  }

  async function handleUpdate(slide: Slide) {
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', slide }),
      })
      if (res.ok) await fetchSlides()
    } catch (err) {
      console.error('update', err)
    }
  }

  return (
    <section className="admin-hero container">
      <h1>Ads Slides</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ads-custom">Custom ads</option>
            <option value="ads-product">Product ad</option>
            <option value="ads-provider">Provider ad</option>
            <option value="ads-wallet">Wallet top-up ad</option>
          </select>

          <input placeholder="target id" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
          {type === 'ads-wallet' && (
            <input placeholder="amount" type="number" value={adAmount === '' ? '' : String(adAmount)} onChange={(e) => setAdAmount(e.target.value ? Number(e.target.value) : '')} />
          )}
          <input placeholder="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <input type="file" accept="image/*,video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Ad'}</button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {slides.map((slide) => (
          <div key={slide.id} style={{ border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
            {slide.image ? <img src={slide.image} alt={slide.caption || ''} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} /> : <div style={{ width: '100%', height: 120, background: '#f5f5f5', borderRadius: 8 }} />}
            <div style={{ marginTop: 10 }}>
              <div><strong>Type:</strong> {slide.type}</div>
              <div><strong>Target:</strong> {slide.targetId || '-'}</div>
              <div><strong>Amount:</strong> {slide.amount ?? '-'}</div>
              <div><strong>Caption:</strong> {slide.caption || '-'}</div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => handleDelete(slide.id)} style={{ flex: 1 }}>Delete</button>
              <button type="button" onClick={() => handleUpdate({ ...slide, visible: !slide.visible })} style={{ flex: 1 }}>
                {slide.visible ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
