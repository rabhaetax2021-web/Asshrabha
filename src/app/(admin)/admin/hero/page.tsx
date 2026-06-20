"use client"

import React, { useEffect, useState } from 'react'

type Slide = {
  id?: string
  image?: string
  type?: string
  targetId?: string
  caption?: string
  position?: number
  visible?: boolean
}

export default function AdminHeroPage() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [loading, setLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [type, setType] = useState('custom')
  const [providers, setProviders] = useState<{id:string;name:string}[]>([])
  const [products, setProducts] = useState<{id:string;name:string}[]>([])
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [adAmount, setAdAmount] = useState<number | ''>('')
  const [targetId, setTargetId] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    fetchSlides()
    fetchProviders()
  }, [])

  async function fetchSlides() {
    try {
      const res = await fetch('/api/shop/hero')
      if (!res.ok) return
      const data = await res.json()
      let slidesData: Slide[] = []
      if (Array.isArray(data)) slidesData = data as Slide[]
      else if (data && Array.isArray((data as any).slides)) slidesData = (data as any).slides
      setSlides(slidesData)
    } catch (err) {
      console.error('fetchSlides', err)
    }
  }

  async function fetchProviders() {
    try {
      const res = await fetch('/api/admin/providers')
      if (!res.ok) return
      const j = await res.json()
      setProviders(j.providers || [])
    } catch (err) {
      console.error('fetchProviders', err)
    }
  }

  async function fetchProducts(providerId: string) {
    try {
      const res = await fetch(`/api/admin/provider-products?providerId=${encodeURIComponent(providerId)}`)
      if (!res.ok) return setProducts([])
      const j = await res.json()
      setProducts(j.products || [])
    } catch (err) {
      console.error('fetchProducts', err)
    }
  }

  async function uploadFile(f: File) {
    const fd = new FormData()
    fd.append('file', f)
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd })
      const j = await r.json()
      return j?.path || j?.data?.path || null
    } catch (err) {
      console.error('upload', err)
      return null
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      let imagePath = ''
      if (file) {
        const p = await uploadFile(file)
        if (!p) throw new Error('upload failed')
        imagePath = p
      }

      const payload = {
        type,
        targetId: targetId || null,
        caption: caption || null,
        image: imagePath || null,
        amount: type === 'wallet' ? (adAmount || null) : null,
      }

      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', slide: payload }),
      })
      if (res.ok) {
        setCaption('')
        setFile(null)
        setTargetId('')
        setType('custom')
        await fetchSlides()
      } else {
        console.error('create slide failed', await res.text())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    if (!confirm('Delete this slide?')) return
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', slide: { id } }),
      })
      if (res.ok) await fetchSlides()
    } catch (err) {
      console.error('delete', err)
    }
  }

  return (
    <section className="admin-hero container">
      <h1>Hero Slides</h1>

      <form onSubmit={handleAdd} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="custom">Custom (image + caption)</option>
            <option value="product">Product</option>
            <option value="provider">Provider</option>
            <option value="wallet">Ad: Add Wallet Balance</option>
          </select>
          {type === 'provider' && (
            <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
              <option value="">Select provider</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          {type === 'product' && (
            <>
              <select value={selectedProvider} onChange={(e) => { setSelectedProvider(e.target.value); fetchProducts(e.target.value); setTargetId('') }}>
                <option value="">Select provider</option>
                {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={targetId} onChange={(e) => setTargetId(e.target.value)}>
                <option value="">Select product</option>
                {products.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
              </select>
            </>
          )}
          {type === 'wallet' && (
            <input placeholder="amount" type="number" value={adAmount as any} onChange={(e)=>setAdAmount(e.target.value?Number(e.target.value):'')} />
          )}
          <input placeholder="target id (for product/provider)" value={targetId} onChange={(e) => setTargetId(e.target.value)} />
          <input placeholder="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Add Slide'}</button>
          <button type="button" onClick={() => saveAll()} style={{ marginLeft: 8 }}>Save All</button>
        </div>
      </form>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {slides.map((s, idx) => (
          <div key={s.id || idx} style={{ border: '1px solid #ddd', padding: 8, borderRadius: 6 }}>
            {s.image ? <img src={s.image} alt={s.caption || ''} style={{ width: '100%', height: 120, objectFit: 'cover' }} /> : <div style={{ width: '100%', height: 120, background: '#f3f3f3' }} />}
            <div style={{ marginTop: 8 }}>
              <div><strong>Type:</strong> {s.type}</div>
              <div><strong>Target:</strong> {s.targetId || '-'}</div>
              <div><strong>Caption:</strong> {s.caption || '-'}</div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <select value={s.visible ? 'visible' : 'hidden'} onChange={async (e) => {
                const v = e.target.value === 'visible'
                await updateSlide({ ...s, visible: v })
              }}>
                <option value="visible">Visible</option>
                <option value="hidden">Hidden</option>
              </select>
              <button onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )

  async function updateSlide(slide: Slide) {
    try {
      const res = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', slide }),
      })
      if (res.ok) await fetchSlides()
    } catch (err) {
      console.error('updateSlide', err)
    }
  }

  async function saveAll() {
    try {
      await fetch('/api/admin/hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', slides }),
      })
      alert('Saved')
    } catch (err) {
      console.error('saveAll', err)
    }
  }
}
