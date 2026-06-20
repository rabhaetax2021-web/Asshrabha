import React from 'react'
import { listCatalogProducts } from '@/lib/actions/provider.actions'

export default async function CatalogPage() {
  const products = await listCatalogProducts()

  return (
    <section className="provider-catalog container">
      <h1>Catalog</h1>
      <div className="catalog-grid">
        {products.map(p => (
          <div key={p.id} className="catalog-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0]} alt={p.nameEN || p.nameAR} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }} />
            ) : (
              <div style={{ width: '100%', height: 120, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>📦</div>
            )}
            <h3 style={{ marginBottom: 4 }}>{p.nameEN || p.nameAR}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
              Wholesale: {p.wholesaleMinPrice || p.minimumPrice} - {p.wholesaleMaxPrice || p.maximumPrice} EGP
            </p>
            {Number(p.retailMinPrice) > 0 || Number(p.retailMaxPrice) > 0 ? (
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)', marginBottom: 'var(--space-2)' }}>
                Retail: {p.retailMinPrice} - {p.retailMaxPrice} EGP
              </p>
            ) : null}
            <a href={`/provider/products/catalog/${p.id}`} className="btn btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-2)' }}>Add listing</a>
          </div>
        ))}
      </div>
    </section>
  )
}
