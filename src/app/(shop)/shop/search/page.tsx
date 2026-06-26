import React from 'react'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function ShopSearchPage({ searchParams }: { searchParams?: any }) {
  const q = (searchParams?.q || '').toString().trim()
  const current = await getCurrentUser()
  const isShop = !!current && (current.role === 'PROVIDER' || current.customerType === 'SHOP')
  let preferredLocationId: string | null = null
  if (current) {
    const address = await prisma.address.findFirst({ where: { userId: current.id }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }) as any
    preferredLocationId = address?.locationId || null
  }

  let products: any[] = []
  let providers: any[] = []

  if (q) {
    const productWhere: any = {
      status: 'APPROVED',
      OR: [
        { catalogProduct: { nameEN: { contains: q, mode: 'insensitive' } } },
        { catalogProduct: { nameAR: { contains: q, mode: 'insensitive' } } },
      ],
    }
    if (preferredLocationId) {
      productWhere.provider = {
        user: { role: 'PROVIDER' },
        deliveryZones: {
          some: {
            locationId: preferredLocationId,
            isActive: true,
          }
        }
      }
    } else {
      productWhere.provider = { user: { role: 'PROVIDER' } }
    }

    products = await prisma.providerProduct.findMany({
      where: productWhere,
      include: { catalogProduct: true, provider: { include: { user: true } } },
      take: 50,
      orderBy: { updatedAt: 'desc' }
    })

    const providerWhere: any = {
      isVisible: true,
      user: { role: 'PROVIDER' },
      OR: [
        { shopNameEN: { contains: q, mode: 'insensitive' } },
        { shopNameAR: { contains: q, mode: 'insensitive' } },
        { user: { nameEN: { contains: q, mode: 'insensitive' } } },
        { user: { nameAR: { contains: q, mode: 'insensitive' } } },
      ]
    }
    if (preferredLocationId) {
      providerWhere.deliveryZones = {
        some: {
          locationId: preferredLocationId,
          isActive: true,
        }
      }
    }

    providers = await prisma.providerProfile.findMany({
      where: providerWhere,
      include: { user: true },
      take: 50,
      orderBy: { createdAt: 'desc' }
    })
  }

  return (
    <section className="container" style={{ paddingTop: 24 }}>
      <h1 style={{ fontSize: 'var(--text-2xl)', marginBottom: 12 }}>Search</h1>

      <form method="get" style={{ marginBottom: 18 }}>
        <input name="q" defaultValue={q} placeholder="Search products or providers" className="input" style={{ width: 420, padding: '8px 10px' }} />
        <button className="btn" style={{ marginLeft: 8 }} type="submit">Search</button>
      </form>

      {!q && (
        <div style={{ color: 'var(--text-muted)' }}>Type a product name or provider/shop name and press Search.</div>
      )}

      {q && (
        <div>
          <h3 style={{ marginTop: 8 }}>Providers</h3>
          {providers.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No providers found.</div> : (
            <div style={{ display: 'grid', gap: 8 }}>
              {providers.map(p => (
                <Link key={p.id} href={`/shop/store/${p.id}`} className="card" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 6, background: '#f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{(p.shopNameEN || p.shopNameAR || '')?.charAt(0)}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.shopNameEN || p.shopNameAR}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{p.user?.nameEN || p.user?.nameAR}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <h3 style={{ marginTop: 18 }}>Products</h3>
          {products.length === 0 ? <div style={{ color: 'var(--text-muted)' }}>No products found.</div> : (
            <div className="product-grid">
              {products.map((p) => (
                <Link key={p.id} href={`/shop/product/${p.catalogProduct?.id || p.id}`} className="product-card">
                  <div className="product-image-wrap">
                    {p.catalogProduct?.images && p.catalogProduct.images.length > 0 ? (
                      <img src={p.catalogProduct.images[0]} alt={p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'} className="product-image" />
                    ) : (
                      <div className="product-image-placeholder">📦</div>
                    )}
                  </div>
                  <div className="product-card-body">
                    <div className="product-card-title">{p.catalogProduct?.nameEN || p.catalogProduct?.nameAR || 'Product'}</div>
                    <div className="product-card-provider" style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>{p.provider?.shopNameEN || p.provider?.shopNameAR}</div>
                    <div className="product-card-footer">
                      <div className="price">{isShop ? `Wholesale: ${p.wholesalePrice ?? p.sellingPrice} EGP` : (p.retailPrice ? `${p.retailPrice} EGP` : `${p.sellingPrice} EGP`)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

    </section>
  )
}
