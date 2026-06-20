import React from 'react'
import { getFirstProvider, getProductsByProviderId } from '@/lib/actions/provider.actions'

export default async function MyProductsPage() {
  const provider = await getFirstProvider()
  const products = provider ? await getProductsByProviderId(provider.id) : []

  return (
    <section className="provider-products container">
      <h1>My Products</h1>
      {!provider && <p>No provider found (seeded demo). Please login as provider.</p>}

      <div className="product-grid">
        {products.length === 0 && <p>No products yet.</p>}
        {products.map(p => (
          <div key={p.id} className="product-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
              <img src={p.catalogProduct.images[0]} alt={p.catalogProduct?.nameEN || p.catalogProduct?.nameAR} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }} />
            ) : (
              <div style={{ width: '100%', height: 120, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>📦</div>
            )}
            <h3 style={{ marginBottom: 4 }}>{p.catalogProduct?.nameEN || p.catalogProduct?.nameAR}</h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Wholesale: {p.wholesalePrice || p.sellingPrice} EGP</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Retail: {p.retailPrice || 0} EGP</p>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Stock: {p.stockQuantity}</p>
            <p style={{ fontSize: 'var(--text-sm)' }}>
              <span className={`badge ${p.status === 'APPROVED' ? 'badge-success' : p.status === 'PENDING_APPROVAL' ? 'badge-warning' : 'badge-error'}`}>{p.status}</span>
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
