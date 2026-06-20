import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function StorePage({ params, searchParams }: { params: any; searchParams?: any }) {
  const resolvedParams = await params
  const resolvedSearch = searchParams && typeof (searchParams as any).then === 'function' ? await searchParams : searchParams
  const categoryFilter = (resolvedSearch?.category || '').toString()

  const store = await prisma.providerProfile.findFirst({
    where: { id: resolvedParams.id, isVisible: true },
    include: { user: true }
  })
  if (!store) return <div>Store not found</div>

  // Fetch all approved products with catalog details and categories
  const products = await prisma.providerProduct.findMany({
    where: { 
      providerId: store.id, 
      status: 'APPROVED',
      ...(categoryFilter ? { catalogProduct: { category: { slug: categoryFilter } } } : {})
    },
    include: { catalogProduct: { include: { category: true } } },
    orderBy: { createdAt: 'desc' },
  })

  // Extract unique categories from all products for the filter
  const allProducts = await prisma.providerProduct.findMany({
    where: { providerId: store.id, status: 'APPROVED' },
    include: { catalogProduct: { include: { category: true } } },
  })
  const categoryMap = new Map()
  allProducts.forEach(p => {
    const cat = p.catalogProduct?.category
    if (cat && !categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, cat)
    }
  })
  const categories = Array.from(categoryMap.values())

  return (
    <section className="store-page container">
      {/* Store Banner */}
      {store.banner ? (
        <div className="store-banner" style={{ backgroundImage: `url(${store.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="store-banner-overlay">
            <h1>{store.shopNameEN || store.shopNameAR}</h1>
          </div>
        </div>
      ) : (
        <div className="store-banner-placeholder">
          🏪
        </div>
      )}

      {/* Store Header Info */}
      <div className="store-header">
        {store.logo ? (
          <img src={store.logo} alt={store.shopNameEN || store.shopNameAR} className="provider-logo-lg" />
        ) : (
          <div className="provider-logo-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-2xl)' }}>
            {(store.shopNameEN || store.shopNameAR)?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="store-header-info">
          <h1>{store.shopNameEN || store.shopNameAR}</h1>
          <p>{store.descriptionEN || store.descriptionAR || 'No description available.'}</p>
          <div className="store-header-meta">
            {store.rating && store.rating > 0 && (
              <span>⭐ {store.rating.toFixed(1)}</span>
            )}
            <span>📦 {products.length} products</span>
            {store.locationAddress && (
              <span>📍 {store.locationAddress}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      {categories.length > 0 && (
        <div className="category-pills">
          <Link href={`/shop/store/${store.id}`} className={!categoryFilter ? 'category-pill active' : 'category-pill'}>All</Link>
          {categories.map((cat) => (
            <Link key={cat.id} href={`/shop/store/${store.id}?category=${encodeURIComponent(cat.slug)}`} className={categoryFilter === cat.slug ? 'category-pill active' : 'category-pill'}>
              {cat.nameEN || cat.nameAR}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {products.length > 0 ? (
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
                  {p.catalogProduct?.category?.nameEN || ''}
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
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📦</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            No products yet
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            This store hasn&apos;t added any products yet.
          </p>
        </div>
      )}
    </section>
  )
}
