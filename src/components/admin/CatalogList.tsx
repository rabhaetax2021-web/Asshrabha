"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import IntlText from '@/components/IntlText'

type Product = {
  id: string
  nameEN?: string | null
  nameAR?: string | null
  descriptionEN?: string | null
  descriptionAR?: string | null
  images: string[]
  wholesaleMinPrice: number
  wholesaleMaxPrice: number
  retailMinPrice: number
  retailMaxPrice: number
  // minimumPrice/maximumPrice removed from schema
}

export default function CatalogList({ products: initial }: { products: Product[] }) {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>(initial || [])
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleArchive = async (id: string) => {
    setPendingId(id)
    try {
      const res = await fetch(`/api/admin/catalog-products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Archive failed')
      setProducts(prev => prev.filter(p => p.id !== id))
      router.refresh()
    } catch (err) {
      alert('Failed to archive product')
    } finally {
      setPendingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="catalog-list">
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, maxWidth: 420, width: '90%' }}>
            <h3 style={{ marginTop: 0 }}>Delete catalog product?</h3>
            <p>This will archive the product and suspend related provider listings. This action can be reversed from the admin catalog later.</p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn" onClick={() => setConfirmId(null)}>Cancel</button>
              <button type="button" className="btn danger" disabled={pendingId === confirmId} onClick={() => handleArchive(confirmId)}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {products.map(p => (
        <div key={p.id} className="catalog-item" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
          {p.images && p.images.length > 0 ? (
            <img src={p.images[0]} alt={p.nameEN || p.nameAR || ''} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
          ) : (
            <div style={{ width: 96, height: 96, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xl)' }}>📦</div>
          )}
          <div style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 4 }}><Link href={`/admin/catalog/${p.id}`}>{p.nameEN || p.nameAR}</Link></h3>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 6 }}>
              {p.descriptionEN || p.descriptionAR ? (
                <div style={{ marginBottom: 6 }}>{(p.descriptionEN || p.descriptionAR)}</div>
              ) : null}
              <div>
                <strong>Wholesale:</strong> {p.wholesaleMinPrice} - {p.wholesaleMaxPrice} EGP
                <span style={{ marginLeft: 'var(--space-4)' }}><strong>Retail:</strong> {p.retailMinPrice} - {p.retailMaxPrice} EGP</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link href={`/admin/catalog/edit-product/${p.id}`} className="btn">Edit</Link>
            <button type="button" className="btn danger" disabled={pendingId === p.id} onClick={() => setConfirmId(p.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
