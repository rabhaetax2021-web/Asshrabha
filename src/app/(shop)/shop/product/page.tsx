import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

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
      catalogProduct: { include: { category: true } },
      provider: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  return (
    <section className="category-page container">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1>All Products</h1>
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
            const name = product.catalogProduct?.nameEN || product.catalogProduct?.nameAR || 'Product'
            const category = product.catalogProduct?.category?.nameEN || product.catalogProduct?.category?.nameAR || ''
            const price = isShop ? (product.wholesalePrice ?? product.sellingPrice) : (product.retailPrice ?? product.sellingPrice)
            const priceLabel = isShop ? 'Wholesale' : 'Retail'
            return (
              <Link key={product.id} href={`/shop/product/${product.id}`} className="product-card">
                <div className="product-image-wrap">
                  {image ? (
                    <img src={image} alt={name} className="product-image" />
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
                  <div className="product-card-title">{name}</div>
                  <div className="product-card-provider">{category}</div>
                  <div className="product-card-footer">
                    <div className="price">{priceLabel}: {price} EGP</div>
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
