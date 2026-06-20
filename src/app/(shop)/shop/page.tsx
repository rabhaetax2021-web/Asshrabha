import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import HeroSlider from '@/components/shop/HeroSlider'
import { getSlides } from '@/lib/heroSlides'

export default async function ShopHomePage() {
  // Fetch categories for quick links
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' }, take: 10 })

  // Fetch visible stores with their approved products and catalog details
  const stores = await prisma.providerProfile.findMany({
    where: { isVisible: true },
    include: {
      user: true,
      products: {
        where: { status: 'APPROVED' },
        include: {
          catalogProduct: { include: { category: true } },
        },
        take: 4,
      },
    },
    take: 12,
  })

  const slides = await getSlides()

  return (
    <section className="shop-home">
      {/* Hero Section */}
      <HeroSlider slides={slides} />

      <div className="container">
        {/* Category Quick Links */}
        {categories.length > 0 && (
          <div className="category-quick-links">
            {categories.map((c) => (
              <Link key={c.id} href={`/shop/category/${c.slug}`} className="category-quick-link">
                {c.nameEN || c.nameAR}
              </Link>
            ))}
          </div>
        )}

        {/* Featured Stores */}
        <h2 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
          Featured Stores
        </h2>

        <div className="store-list">
          {stores.map((s) => (
            <div key={s.id} className="store-card">
              {/* Store Header with Logo */}
              <div className="store-card-header">
                {s.logo ? (
                  <img src={s.logo} alt={s.shopNameEN || s.shopNameAR} className="provider-logo" />
                ) : s.user?.avatar ? (
                  <img src={s.user.avatar} alt={s.user?.nameEN || s.user?.nameAR || 'avatar'} className="provider-logo" style={{ borderRadius: 8 }} />
                ) : (
                  <div className="provider-logo-placeholder">
                    {(s.shopNameEN || s.shopNameAR)?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>
                    <Link href={`/shop/store/${s.id}`}>{s.shopNameEN || s.shopNameAR || s.user?.nameEN || s.user?.nameAR}</Link>
                  </h3>
                  { (s.user?.nameEN || s.user?.nameAR) && (
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginTop: 6 }}>{s.user?.nameEN || s.user?.nameAR}</div>
                  )}
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap', marginTop: 'var(--space-1)' }}>
                    {s.rating && s.rating > 0 && (
                      <span className="rating">⭐ {s.rating.toFixed(1)}</span>
                    )}
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                      {s.products?.length || 0} products
                    </span>
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              {s.products && s.products.length > 0 ? (
                <div className="product-grid">
                  {s.products.map((p) => (
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
                        <Link
                          href={`/shop/product/${p.id}`}
                          className="product-card-title"
                        >
                          {p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'}
                        </Link>
                        <div className="product-card-footer">
                          <div className="price" style={{ fontSize: 'var(--text-sm)' }}>
                            Wholesale: {p.wholesalePrice || p.sellingPrice} EGP
                          </div>
                          {Number(p.retailPrice) > 0 && (
                            <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                              Retail: {p.retailPrice} EGP
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>No products available yet.</p>
              )}
            </div>
          ))}
        </div>

        {stores.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
            <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🏪</div>
            <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
              No stores available yet
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>
              Check back soon as our providers set up their shops.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
