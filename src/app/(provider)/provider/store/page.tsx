import React from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ProviderStoreClient from '@/components/provider/ProviderStoreClient'

export default async function StorePage() {
  const current = await getCurrentUser()
  if (!current) return <div>Please sign in as a provider to manage your store.</div>

  const provider = await prisma.providerProfile.findFirst({ where: { userId: current.id }, include: { user: true } })
  if (!provider) return <div>No provider account found for your user.</div>

  const allProducts = await prisma.providerProduct.findMany({
    where: { providerId: provider.id, status: 'APPROVED' },
    include: {
      catalogProduct: { include: { category: true } },
      providerProductOptions: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const categories = Array.from(
    new Map(
      allProducts
        .map((p) => p.catalogProduct?.category)
        .filter(Boolean)
        .map((cat) => [cat.id, cat])
    ).values()
  )

  return (
    <section className="provider-store container">
      <div className="store-grid">
        <div className="store-card">
          <section className="store-page container" style={{ padding: 0 }}>
            {provider.banner ? (
              <div className="store-banner" style={{ backgroundImage: `url(${provider.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="store-banner-overlay">
                  <h1>{provider.shopNameEN || provider.shopNameAR}</h1>
                </div>
              </div>
            ) : (
              <div className="store-banner-placeholder">🏪</div>
            )}

            <div className="store-header">
              {provider.logo ? (
                <img src={provider.logo} alt={provider.shopNameEN || provider.shopNameAR} className="provider-logo-lg" />
              ) : (
                <div className="provider-logo-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-2xl)' }}>
                  {(provider.shopNameEN || provider.shopNameAR)?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="store-header-info">
                <h1>{provider.shopNameEN || provider.shopNameAR}</h1>
                <p>{provider.descriptionEN || provider.descriptionAR || 'No description available.'}</p>
                <div className="store-header-meta">
                  {provider.rating && provider.rating > 0 && <span>⭐ {provider.rating.toFixed(1)}</span>}
                  <span>📦 {allProducts.length} products</span>
                  {provider.locationAddress && <span>📍 {provider.locationAddress}</span>}
                </div>
                {(provider.minOrderItems || provider.minOrderAmount) && (
                  <div className="card" style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', border: '1px solid var(--primary-100)', background: 'var(--primary-50)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-2)' }}>Store purchase rules</div>
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      {provider.minOrderItems ? `Minimum order items: ${provider.minOrderItems}` : null}
                      {provider.minOrderItems && provider.minOrderAmount ? ' · ' : null}
                      {provider.minOrderAmount ? `Minimum order amount: ${Number(provider.minOrderAmount).toFixed(2)} EGP` : null}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {categories.length > 0 && (
              <div className="category-pills">
                <span className="category-pill active">All</span>
                {categories.map((cat: any) => (
                  <span key={cat.id} className="category-pill">{cat.nameEN || cat.nameAR}</span>
                ))}
              </div>
            )}

            {allProducts.length > 0 ? (
              <div>
                {categories.map((cat: any) => {
                  const items = allProducts.filter((p) => p.catalogProduct?.category?.id === cat.id)
                  if (!items.length) return null

                  return (
                    <section key={cat.id} style={{ marginBottom: 'var(--space-8)' }}>
                      <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>{cat.nameEN || cat.nameAR}</h3>
                      <div className="product-grid">
                        {items.map((p) => {
                          const nameEN = p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'
                          const nameAR = p.catalogProduct?.nameAR || ''
                          const descriptionEN = p.catalogProduct?.descriptionEN || ''
                          const descriptionAR = p.catalogProduct?.descriptionAR || ''
                          const unit = p.wholesaleUnit || p.catalogProduct?.unitType || 'UNIT'

                          return (
                            <div key={p.id} className="product-card">
                              <div className="product-image-wrap">
                                {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                                  <img src={p.catalogProduct.images[0]} alt={nameEN} className="product-image" />
                                ) : (
                                  <div className="product-image-placeholder">📦</div>
                                )}
                              </div>
                              <div className="product-card-body">
                                <div className="product-card-title">{nameEN}</div>
                                <div className="product-card-subtitle">{nameAR}</div>
                                {descriptionEN && <div className="product-card-description">{descriptionEN}</div>}
                                {descriptionAR && <div className="product-card-description" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{descriptionAR}</div>}
                                <div className="product-card-footer">
                                  <div className="price" style={{ fontSize: 'var(--text-sm)' }}>Wholesale: {(p.wholesalePrice ?? p.sellingPrice)} EGP / {unit}</div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
                <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📦</div>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>No products yet</h3>
                <p style={{ color: 'var(--text-muted)' }}>This store hasn&apos;t added any products yet.</p>
              </div>
            )}
          </section>
        </div>

        <div className="store-form">
          <ProviderStoreClient provider={provider} />
        </div>
      </div>
    </section>
  )
}
