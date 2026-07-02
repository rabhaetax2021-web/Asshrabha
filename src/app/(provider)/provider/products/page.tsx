import React from 'react'
import { getFirstProvider, getProductsByProviderId } from '@/lib/actions/provider.actions'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import ProductActions from '@/components/provider/ProductActions'

function renderStatusBadge(status: string) {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'REQUIRES_RE_REGISTRATION') {
    return <span className="badge badge-warning">Requires Re-registration</span>
  }
  if (normalized === 'CONSUMED') {
    return <span className="badge badge-default">Consumed</span>
  }
  if (normalized === 'ACTIVE') {
    return <span className="badge badge-success">Active</span>
  }
  if (normalized === 'APPROVED') {
    return <span className="badge badge-success">Approved</span>
  }
  if (normalized === 'PENDING_APPROVAL') {
    return <span className="badge badge-warning">Pending Approval</span>
  }
  return <span className="badge badge-default">{status}</span>
}

export default async function MyProductsPage() {
  const provider = await getFirstProvider()
  const products = provider ? await getProductsByProviderId(provider.id) : []
  const pending = products.filter((p) => p.status === 'PENDING_APPROVAL')
  const active = products.filter((p) => p.status === 'ACTIVE' || p.status === 'APPROVED')
  const needsReregistration = products.filter((p) => p.status === 'REQUIRES_RE_REGISTRATION' || p.status === 'CONSUMED')
  const other = products.filter((p) => !['PENDING_APPROVAL', 'ACTIVE', 'APPROVED', 'REQUIRES_RE_REGISTRATION', 'CONSUMED'].includes(String(p.status)))

  return (
    <section className="provider-products container">
      <h1>My Products</h1>
      {!provider && <p>No provider found (seeded demo). Please login as provider.</p>}

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <p className="text-muted">Manage your approved and pending listings.</p>
          <Link href="/provider/products/catalog"><Button variant="outline">Browse Catalog</Button></Link>
        </div>

        {pending.length > 0 && (
          <section style={{ marginBottom: 'var(--space-6)' }}>
            <h2>Pending Approval</h2>
            <div className="product-grid">
              {pending.map((p) => (
                <div key={p.id} className="product-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href={`/shop/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                      <span className="badge badge-warning">Pending Approval</span>
                    </p>
                  </Link>
                  <div style={{ marginTop: 'auto' }}>
                    <ProductActions id={p.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {active.length > 0 && (
          <section style={{ marginBottom: 'var(--space-6)' }}>
            <h2>Available Listings</h2>
            <div className="product-grid">
              {active.map((p) => (
                <div key={p.id} className="product-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href={`/shop/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                      {renderStatusBadge(p.status)}
                    </p>
                  </Link>
                  <div style={{ marginTop: 'auto' }}>
                    <ProductActions id={p.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {needsReregistration.length > 0 && (
          <section style={{ marginBottom: 'var(--space-6)' }}>
            <h2>Needs Re-registration</h2>
            <div className="product-grid">
              {needsReregistration.map((p) => (
                <div key={p.id} className="product-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href={`/shop/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                      {renderStatusBadge(p.status)}
                    </p>
                  </Link>
                  <div style={{ marginTop: 'auto' }}>
                    <ProductActions id={p.id} reRegister={p.status === 'REQUIRES_RE_REGISTRATION' || p.status === 'CONSUMED'} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {other.length > 0 && (
          <section>
            <h2>Other Listings</h2>
            <div className="product-grid">
              {other.map((p) => (
                <div key={p.id} className="product-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Link href={`/shop/product/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                      {renderStatusBadge(p.status)}
                    </p>
                  </Link>
                  <div style={{ marginTop: 'auto' }}>
                    <ProductActions id={p.id} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {products.length === 0 && <p>No products yet.</p>}
      </Card>
    </section>
  )
}
