import React from 'react'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CategoryFilter from '@/components/shop/CategoryFilter'
import { getCurrentUser } from '@/lib/auth'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const t = await getTranslations('shop')
  const currentUser = await getCurrentUser()
  const isShop = !!currentUser && (currentUser.role === 'PROVIDER' || currentUser.customerType === 'SHOP')
  let preferredLocationId: string | null = null
  if (currentUser) {
    const address = await prisma.address.findFirst({ where: { userId: currentUser.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }) as any
    preferredLocationId = address?.locationId || null
  }

  // Fetch the category
  const category = await prisma.category.findUnique({ where: { slug } })
  if (!category) return <div>{t('categoryNotFound')}</div>

  // Fetch all approved provider products in this category
  const products = await prisma.providerProduct.findMany({
    where: {
      status: 'APPROVED',
      catalogProduct: { category: { slug } },
      provider: {
        user: { role: 'PROVIDER' },
        ...(preferredLocationId ? {
          deliveryZones: {
            some: {
              locationId: preferredLocationId,
              isActive: true,
            },
          },
        } : {}),
      },
    },
    include: {
      catalogProduct: { include: { category: true, unitRanges: true } },
      provider: true,
      providerProductOptions: true,
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
          {products.map((p) => {
            const nameEN = p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || t('product')
            const nameAR = p.catalogProduct?.nameAR || ''
            const descriptionEN = p.catalogProduct?.descriptionEN || ''
            const descriptionAR = p.catalogProduct?.descriptionAR || ''
            const unit = p.wholesaleUnit || p.catalogProduct?.unitType || 'UNIT'

            return (
              <Link key={p.id} href={`/shop/product/${p.id}`} className="product-card">
                <div className="product-image-wrap">
                  {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                    <img
                      src={p.catalogProduct.images[0]}
                      alt={nameEN}
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
                  <div className="product-card-title">{nameEN}</div>
                  <div className="product-card-subtitle">{nameAR}</div>
                  {descriptionEN && <div className="product-card-description">{descriptionEN}</div>}
                  {descriptionAR && <div className="product-card-description" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{descriptionAR}</div>}
                  <div className="product-card-provider">
                    {p.provider?.logo ? (
                      <img src={p.provider.logo} alt={p.provider?.shopNameEN || p.provider?.shopNameAR || 'Provider'} className="provider-logo-sm" />
                    ) : (
                      <div className="provider-logo-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xs)' }}>
                        {(p.provider?.shopNameEN || p.provider?.shopNameAR || 'S')?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>{p.provider?.shopNameEN || p.provider?.shopNameAR}</div>
                  </div>
                  <div className="product-card-footer">
                    <div className="price" style={{ fontSize: 'var(--text-sm)' }}>
                      Price: {isShop ? (p.wholesalePrice ?? p.sellingPrice) : (p.retailPrice ?? p.sellingPrice)} EGP / {unit}
                    </div>
                    <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                      {p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📦</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            {t('noProductsInCategory')}
          </h3>
          <p style={{ color: 'var(--text-muted)' }}>
            {t('noProductsInCategoryMessage')}
          </p>
          <Link href="/shop" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
            {t('browseAllStores')}
          </Link>
        </div>
      )}
    </section>
  )
}
