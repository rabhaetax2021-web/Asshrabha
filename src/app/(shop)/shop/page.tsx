import React from 'react'
import { getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import HeroSlider from '@/components/shop/HeroSliderClient'
import { getSlides } from '@/lib/heroSlides'
import AddToCartButton from '@/components/shop/AddToCartButton'

export default async function ShopHomePage() {
  const t = await getTranslations('shop')
  const tc = await getTranslations('common')
  const current = await getCurrentUser()
  const isShop = !!current && (current.role === 'PROVIDER' || current.customerType === 'SHOP')
  let preferredLocationId: string | null = null
  if (current) {
    const address = await prisma.address.findFirst({ where: { userId: current.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }) as any
    preferredLocationId = address?.locationId || null
  }

  const slides = await getSlides()
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  const stores = await prisma.providerProfile.findMany({
    where: {
      isVisible: true,
      user: { role: 'PROVIDER' },
      ...(preferredLocationId ? {
        deliveryZones: {
          some: {
            locationId: preferredLocationId,
            isActive: true,
          }
        }
      } : {}),
    },
    include: { user: true, _count: { select: { products: true } }, products: { where: { status: 'APPROVED' }, include: { catalogProduct: true }, orderBy: { createdAt: 'desc' }, take: 6 } },
    orderBy: { createdAt: 'desc' },
    take: 12,
  })

  return (
    <section className="shop-home container dashboard-shell">
      <div className="dashboard-hero dashboard-hero--shop">
        <div className="dashboard-hero-content">
          <form action="/shop/search" method="get" className="dashboard-search">
            <input name="q" placeholder={t('searchPlaceholder') || 'Search products or stores'} className="input" />
            <button className="btn" type="submit">{tc('search')}</button>
          </form>
        </div>
      </div>

      {slides && slides.length > 0 && (
        <div>
          <HeroSlider slides={slides} />
        </div>
      )}

      <div className="dashboard-card">
        <div className="dashboard-section-title">
          <div>
            <h2 style={{ margin: 0 }}>{t('browseCategories') || 'Browse popular categories'}</h2>
            <p>{t('browseCategoriesSubtitle') || 'Jump into the collections your customers love.'}</p>
          </div>
        </div>
        {categories.length > 0 && (
          <div className="category-quick-links">
            {categories.map(c => (
              <Link key={c.id} href={`/shop/category/${c.slug}`} className="category-quick-link">
                {c.nameEN || c.nameAR}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="dashboard-card">
        <div className="dashboard-section-title">
          <div>
            <h2 style={{ margin: 0 }}>{t('featuredStores') || 'Featured stores'}</h2>
            <p>{t('featuredStoresSubtitle') || 'Trusted sellers with premium products and fast checkout.'}</p>
          </div>
        </div>
        <div className="store-list">
          {stores.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
              <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🏪</div>
              <div style={{ color: 'var(--text-muted)' }}>{t('noStores') || 'No stores available yet.'}</div>
            </div>
          )}
          {stores.map(s => (
            <div key={s.id} className="store-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Link href={`/shop/store/${s.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="store-card-header">
                  {s.logo ? <img src={s.logo} alt={s.shopNameEN || s.shopNameAR} className="provider-logo" /> : (
                    <div className="provider-logo-placeholder">{(s.shopNameEN || s.shopNameAR)?.charAt(0).toUpperCase()}</div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ margin: 0 }}>{s.shopNameEN || s.shopNameAR || s.user?.nameEN || s.user?.nameAR}</h3>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{s.user?.nameEN || s.user?.nameAR}</div>
                  </div>
                </div>
              </Link>

              {(() => {
                const parts = s.products || []
                let preview = parts
                if (parts.length > 2) {
                  const shuffled = parts.slice().sort(() => Math.random() - 0.5)
                  preview = shuffled.slice(0, 2)
                }
                return (
                  <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                    {preview.map((p: any) => (
                      <div key={p.id} style={{ width: 150, border: '1px solid var(--border-light)', borderRadius: 12, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'stretch', background: 'var(--bg-secondary)' }}>
                        <Link href={`/shop/product/${p.catalogProduct?.id || p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ height: 80, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 10 }}>
                            {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                              <img src={p.catalogProduct.images[0]} alt={p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                            ) : (
                              <div style={{ fontSize: 28 }}>📦</div>
                            )}
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{p.catalogProduct?.nameEN || p.catalogProduct?.nameAR}</div>
                        </Link>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>Price: {isShop ? (p.wholesalePrice ?? p.sellingPrice) : (p.retailPrice ?? p.sellingPrice)} EGP</div>
                          <div>
                            <AddToCartButton product={p} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
