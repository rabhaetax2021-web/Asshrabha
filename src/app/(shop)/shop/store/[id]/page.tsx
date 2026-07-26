import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations, getLocale } from 'next-intl/server'
import AddToCartButton from '@/components/shop/AddToCartButton'

export default async function StorePage({ params, searchParams }: { params: any; searchParams?: any }) {
  const t = await getTranslations('shop')
  const locale = await getLocale()
  const resolvedParams = await params
  const resolvedSearch = searchParams && typeof (searchParams as any).then === 'function' ? await searchParams : searchParams
  const categoryFilter = (resolvedSearch?.category || '').toString()

  const store = await prisma.providerProfile.findFirst({
    where: { id: resolvedParams.id, isVisible: true, user: { role: 'PROVIDER' } },
    include: { user: true }
  })
  if (!store) return <div>Store not found</div>

  const current = await getCurrentUser()
  const isShop = !!current && (current.role === 'PROVIDER' || current.customerType === 'SHOP')

  // Fetch all approved products with catalog details and categories
  const allProducts = await prisma.providerProduct.findMany({
    where: { providerId: store.id, status: 'APPROVED' },
    include: {
      catalogProduct: { include: { category: true, unitRanges: true } },
      provider: true,
      providerProductOptions: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Extract unique categories from all products for the filter
  const categoryMap = new Map()
  allProducts.forEach(p => {
    const cat = p.catalogProduct?.category
    if (cat && !categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, cat)
    }
  })
  const categories = Array.from(categoryMap.values())

  // Optionally filter products when a category is selected
  const products = categoryFilter ? allProducts.filter(p => p.catalogProduct?.category?.slug === categoryFilter) : allProducts

  const getLocalizedValue = (item: any, field: 'name' | 'description') => {
    if (locale === 'ar') return item?.[`${field}AR`] || item?.[`${field}EN`] || ''
    return item?.[`${field}EN`] || item?.[`${field}AR`] || ''
  }

  return (
    <section className="store-page container">
      <div className="card store-banner-card" style={{ marginBottom: 'var(--space-6)', padding: 0, overflow: 'hidden' }}>
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
        <div className="store-header" style={{ padding: 'var(--space-5)' }}>
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
                {(store.minOrderItems || store.minOrderAmount) && (
                  <div className="card" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--primary-100)', background: 'var(--primary-50)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>
                      {t('providerConditions')}
                    </div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {store.minOrderItems ? `${t('minOrderItems')}: ${store.minOrderItems}` : null}
                      {store.minOrderItems && store.minOrderAmount ? ' · ' : null}
                      {store.minOrderAmount ? `${t('minOrderAmount')}: ${Number(store.minOrderAmount).toFixed(2)} EGP` : null}
                    </div>
                  </div>
                )}
          </div>
        </div>

        {/* Categories quick links (only categories this provider has products in) */}
        <div className="dashboard-card" style={{ marginTop: 'var(--space-4)' }}>
          <div className="dashboard-section-title">
            <div>
              <h2 style={{ margin: 0 }}>{t('browseCategories') || 'Browse popular categories'}</h2>
              <p>{t('browseCategoriesSubtitle') || 'Jump into the collections your customers love.'}</p>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="category-quick-links">
              {categories.map((c: any) => (
                <Link key={c.id} href={`/shop/store/${store.id}?category=${c.slug}`} className="category-quick-link">
                  {c.nameEN || c.nameAR}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products grouped by category when no category filter, or show filtered list */}
      {products.length > 0 ? (
        categoryFilter ? (
          <div className="product-grid">
            {products.map((p) => {
              const nameEN = p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'
              const nameAR = p.catalogProduct?.nameAR || ''
              const descriptionEN = p.catalogProduct?.descriptionEN || ''
              const descriptionAR = p.catalogProduct?.descriptionAR || ''
              const unit = p.wholesaleUnit || p.catalogProduct?.unitType || 'UNIT'

              return (
                <Link href={`/shop/product/${p.catalogProduct?.id || p.id}`} key={p.id} className="product-card">
                  <div className="product-image-wrap">
                    {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                      <img src={p.catalogProduct.images[0]} alt={nameEN} className="product-image" />
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
                    <div className="product-card-title">{getLocalizedValue(p.catalogProduct, 'name')}</div>
                    {getLocalizedValue(p.catalogProduct, 'description') && (
                      <div className="product-card-description">{getLocalizedValue(p.catalogProduct, 'description')}</div>
                    )}
                    <div className="product-card-provider">{p.catalogProduct?.category?.nameEN || p.catalogProduct?.category?.nameAR || ''}</div>
                    <div className="product-card-footer">
                      <div className="price" style={{ fontSize: 'var(--text-sm)' }}>{t('price') || 'Price'}: {isShop ? (p.wholesalePrice ?? p.sellingPrice) : (p.retailPrice ?? p.sellingPrice)} EGP / {unit}</div>
                      <AddToCartButton product={p} />
                    </div>
                    <div className="product-card-condition">{p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}</div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          // Render each category and its products
          <div>
            {categories.map((cat) => {
              const items = allProducts.filter(p => p.catalogProduct?.category?.id === cat.id)
              if (!items.length) return null
              return (
                <section key={cat.id} style={{ marginBottom: 'var(--space-8)' }}>
                  <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>{cat.nameEN || cat.nameAR}</h3>
                  <div className="product-grid">
                    {items.map((p) => {
                      const unit = p.wholesaleUnit || p.catalogProduct?.unitType || 'UNIT'

                      return (
                        <Link key={p.id} href={`/shop/product/${p.id}`} className="product-card">
                          <div className="product-image-wrap">
                            {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                              <img src={p.catalogProduct.images[0]} alt={getLocalizedValue(p.catalogProduct, 'name')} className="product-image" />
                            ) : (
                              <div className="product-image-placeholder">📦</div>
                            )}
                          </div>
                          <div className="product-card-body">
                            <div className="product-card-title">{getLocalizedValue(p.catalogProduct, 'name')}</div>
                            {getLocalizedValue(p.catalogProduct, 'description') && (
                              <div className="product-card-description">{getLocalizedValue(p.catalogProduct, 'description')}</div>
                            )}
                            <div className="product-card-footer">
                              <div className="price" style={{ fontSize: 'var(--text-sm)' }}>{t('price') || 'Price'}: {isShop ? (p.wholesalePrice ?? p.sellingPrice) : (p.retailPrice ?? p.sellingPrice)} EGP / {unit}</div>
                              <AddToCartButton product={p} />
                            </div>
                            <div className="product-card-condition">{p.stockQuantity > 0 ? 'In stock' : 'Out of stock'}</div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        )
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
