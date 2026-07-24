import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export default async function ProductListingPage() {
  const current = await getCurrentUser()
  const isShop = !!current && (current.role === 'PROVIDER' || current.customerType === 'SHOP')
  let preferredLocationId: string | null = null

  if (current) {
    const address = await prisma.address.findFirst({ where: { userId: current.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }) as any
    preferredLocationId = address?.locationId || null
  }

  const products = await prisma.providerProduct.findMany({
    where: {
      status: 'APPROVED',
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
    take: 100,
  })

  const t = await getTranslations('shop')

  return (
    <section className="category-page container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>{t('allProducts') || 'All Products'}</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 640, marginTop: 'var(--space-2)' }}>
          Browse every approved product across the Asshrabha marketplace, with clean cards, rich imagery, and fast access to store listings.
        </p>
      </div>

      {products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>📦</div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>
            No products available yet.
          </div>
          <p style={{ color: 'var(--text-muted)' }}>Check back later as providers add new products to the marketplace.</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => {
            const image = product.catalogProduct?.images?.[0]
            const nameEN = product.catalogProduct?.nameEN || 'Untitled'
            const nameAR = product.catalogProduct?.nameAR || 'بدون عنوان'
            const descriptionEN = product.catalogProduct?.descriptionEN || 'No details available.'
            const descriptionAR = product.catalogProduct?.descriptionAR || 'لا توجد تفاصيل.'
            const category = product.catalogProduct?.category?.nameEN || product.catalogProduct?.category?.nameAR || ''
            const price = isShop ? (product.wholesalePrice ?? product.sellingPrice) : (product.retailPrice ?? product.sellingPrice)
            const priceLabel = isShop ? 'Wholesale' : 'Retail'
            const unit = product.wholesaleUnit || product.catalogProduct?.unitType || 'UNIT'
            const providerOptionUnits = (product.providerProductOptions || []).map((o: any) => o.unitType).filter(Boolean)
            const catalogUnitRanges = (product.catalogProduct?.unitRanges || []).map((r: any) => r.unitType).filter(Boolean)
            const providerDefault = product.provider?.defaultWholesaleUnit ? [product.provider.defaultWholesaleUnit] : []
            const conditionUnits = providerOptionUnits.length > 0 ? providerOptionUnits : (catalogUnitRanges.length > 0 ? catalogUnitRanges : providerDefault)
            const conditionsText = conditionUnits && conditionUnits.length > 0
              ? `Options: ${conditionUnits.join(', ')}`
              : 'Conditions will appear on provider page.'

            return (
              <Link key={product.id} href={`/shop/product/${product.id}`} className="product-card">
                <div className="product-image-wrap">
                  {image ? (
                    <img src={image} alt={nameEN} className="product-image" />
                  ) : (
                    <div className="product-image-placeholder">📦</div>
                  )}
                  {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                    <span className="badge badge-warning" style={{ fontSize: 'var(--text-2xs)' }}>
                      Only {product.stockQuantity} left
                    </span>
                  )}
                </div>
                <div className="product-card-body">
                  <div className="product-card-title">{nameEN}</div>
                  <div className="product-card-subtitle">{nameAR}</div>
                  <div className="product-card-description">{descriptionEN}</div>
                  <div className="product-card-description" style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{descriptionAR}</div>
                  <div className="product-card-footer">
                    <div>
                      <div className="price">{priceLabel}: {price} EGP / {unit}</div>
                      <div className="product-card-condition">{conditionsText}</div>
                    </div>
                    <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)' }}>
                      {product.provider?.shopNameEN || product.provider?.shopNameAR}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}
