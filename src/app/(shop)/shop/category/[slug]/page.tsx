import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CategoryFilter from '@/components/shop/CategoryFilter'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Fetch the category
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) return <div>Category not found</div>

  // Fetch all approved provider products in this category
  const products = await prisma.providerProduct.findMany({
    where: {
      status: 'APPROVED',
      catalogProduct: { category: { slug } }
    },
    include: {
      catalogProduct: { include: { category: true } },
      provider: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Fetch all categories for sidebar/filter
  const allCategories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })

  // Extract unique providers for filter
  const providerMap = new Map()
  products.forEach(p => {
    if (p.provider && !providerMap.has(p.provider.id)) {
      providerMap.set(p.provider.id, p.provider)
    }
  })
  const providers = Array.from(providerMap.values())

  return (
    <section className="category-page container">
      <h1>{category.nameEN || category.nameAR}</h1>

      {/* Filter Bar */}
      <CategoryFilter allCategories={allCategories} providers={providers} currentSlug={slug} productCount={products.length} />

      {/* Products */}
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
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📦</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            No products in this category
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            Check back soon as providers add more products.
          </p>
          <Link href="/shop" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            Browse All Stores
          </Link>
        </div>
      )}
    </section>
  )
}
