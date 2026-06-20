import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function SearchPage({ searchParams }: { searchParams: any }) {
  const resolvedSearch = searchParams && typeof (searchParams as any).then === 'function' ? await searchParams : searchParams
  const q = (resolvedSearch?.q || '').toString().trim()

  let products: any[] = []
  if (q) {
    products = await prisma.providerProduct.findMany({
      where: {
        status: 'APPROVED',
        catalogProduct: {
          OR: [
            { nameEN: { contains: q, mode: 'insensitive' } },
            { nameAR: { contains: q, mode: 'insensitive' } },
          ],
        },
      },
      include: {
        catalogProduct: { include: { category: true } },
        provider: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
  }

  return (
    <section className="search-page container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
        Search Products
      </h1>

      <form action="/shop/search" method="get" className="admin-form" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="form-row" style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by product name..."
            className="input"
            style={{ flex: 1, padding: 'var(--space-3)', fontSize: 'var(--text-base)' }}
          />
          <button type="submit" className="btn btn-primary">Search</button>
        </div>
      </form>

      {q && products.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🔍</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>No products found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try a different search term.</p>
        </div>
      )}

      {products.length > 0 && (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.id} className="product-card">
              <div className="product-image-wrap">
                {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                  <img
                    src={p.catalogProduct.images[0]}
                    alt={p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'}
                    className="product-image"
                  />
                ) : (
                  <div className="product-image-placeholder">📦</div>
                )}
                {p.stockQuantity <= 5 && p.stockQuantity > 0 && (
                  <span className="badge badge-warning" style={{ fontSize: 'var(--text-2xs)' }}>
                    Only {p.stockQuantity} left
                  </span>
                )}
              </div>
              <div className="product-card-body">
                <Link href={`/shop/product/${p.id}`} className="product-card-title">
                  {p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'}
                </Link>
                <div className="product-card-provider">
                  {p.provider?.logo ? (
                    <img src={p.provider.logo} alt="" className="provider-logo-sm" />
                  ) : (
                    <div className="provider-logo-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xs)' }}>
                      {(p.provider?.shopNameEN || p.provider?.shopNameAR || 'S')?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <Link href={`/shop/store/${p.provider?.id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
                    {p.provider?.shopNameEN || p.provider?.shopNameAR}
                  </Link>
                </div>
                <div className="product-card-footer">
                  <div className="price" style={{ fontSize: 'var(--text-sm)' }}>
                    Wholesale: {p.wholesalePrice || p.sellingPrice} EGP
                  </div>
                  {Number(p.retailPrice) > 0 && (
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                      Retail: {p.retailPrice} EGP
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
