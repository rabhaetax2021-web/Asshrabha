import React from 'react'
import Link from 'next/link'
import { listCatalogProducts } from '@/lib/actions/provider.actions'

export default async function CatalogPage() {
  const products = await listCatalogProducts()

  return (
    <section className="provider-catalog container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>Catalog</h1>
          <p className="text-muted">Browse catalog products and submit listings with full product context.</p>
        </div>
        <Link href="/provider/suggestions" className="btn btn-secondary">Suggest New Catalog Product</Link>
      </div>
      <div className="catalog-grid">
        {products.map(p => (
          <div key={p.id} className="catalog-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0]} alt={p.nameEN || p.nameAR} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }} />
            ) : (
              <div style={{ width: '100%', height: 160, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>📦</div>
            )}
            <h3 style={{ marginBottom: 8 }}>{p.nameEN || p.nameAR}</h3>
            <p style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{p.descriptionEN || p.descriptionAR || 'No description available.'}</p>
            <div style={{ display: 'grid', gap: 6, marginBottom: 'var(--space-3)' }}>
              <div><strong>Wholesale range:</strong> {p.wholesaleMinPrice} - {p.wholesaleMaxPrice} EGP</div>
              <div><strong>Retail range:</strong> {p.retailMinPrice} - {p.retailMaxPrice} EGP</div>
              <div><strong>Price range:</strong> {p.minimumPrice} - {p.maximumPrice} EGP</div>
              <div><strong>Unit type:</strong> {p.unitType}</div>
            </div>
            <a href={`/provider/products/catalog/${p.id}`} className="btn btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-2)' }}>View details</a>
          </div>
        ))}
      </div>
    </section>
  )
}
