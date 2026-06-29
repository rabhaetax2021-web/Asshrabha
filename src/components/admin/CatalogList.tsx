"use client"

import { useState } from 'react'
import Link from 'next/link'
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
  const [products, setProducts] = useState<Product[]>(initial || [])
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return
    try {
      const res = await fetch(`/api/admin/catalog-products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert('Failed to delete')
    }
  }

  return (
    <div className="catalog-list">
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
            <button type="button" className="btn danger" onClick={() => handleDelete(p.id)}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}
