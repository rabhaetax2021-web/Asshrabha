import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import HeroSlider from '@/components/shop/HeroSlider'
import { getSlides } from '@/lib/heroSlides'
import AddToCartButton from '@/components/shop/AddToCartButton'

export default async function ShopHomePage() {
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
    <section className="shop-home container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>Browse Stores</h1>

      {slides && slides.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <HeroSlider slides={slides} />
        </div>
      )}

      <div style={{ marginBottom: 'var(--space-6)' }}>
        <form action="/shop/search" method="get" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <input name="q" placeholder="Search" className="input" style={{ width: 240, padding: '8px 10px' }} />
            <button className="btn" type="submit">بحث</button>
        </form>
      </div>
      
      {categories.length > 0 && (
        <div className="category-quick-links" style={{ marginBottom: 'var(--space-6)' }}>
          {categories.map(c => (
            <Link key={c.id} href={`/shop/category/${c.slug}`} className="category-quick-link">
              {c.nameEN || c.nameAR}
            </Link>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 'var(--text-xl)', marginBottom: 'var(--space-4)' }}>Featured Stores</h2>
      <div className="store-list">
        {stores.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
            <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>🏪</div>
            <div style={{ color: 'var(--text-muted)' }}>No stores available yet.</div>
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

            {/* Show up to 2 products (randomize when more than 2 available) */}
            {(() => {
              const parts = s.products || []
              let preview = parts
              if (parts.length > 2) {
                // pick two random
                const shuffled = parts.slice().sort(() => Math.random() - 0.5)
                preview = shuffled.slice(0, 2)
              }
              return (
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  {preview.map((p: any) => (
                    <div key={p.id} style={{ width: 150, border: '1px solid #eee', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                      <Link href={`/shop/product/${p.catalogProduct?.id || p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ height: 80, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                          {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                            <img src={p.catalogProduct.images[0]} alt={p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                          ) : (
                            <div style={{ fontSize: 28 }}>📦</div>
                          )}
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{p.catalogProduct?.nameEN || p.catalogProduct?.nameAR}</div>
                      </Link>
                        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{isShop ? `Wholesale: ${p.wholesalePrice ?? p.sellingPrice} EGP` : (p.retailPrice ? `${p.retailPrice} EGP` : `${p.sellingPrice} EGP`)}</div>
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
    </section>
  )
}
