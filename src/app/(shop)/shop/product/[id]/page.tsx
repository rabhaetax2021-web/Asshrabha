import { getProductById } from '@/lib/actions/shop.actions'
import React from 'react'
import AddToCart from '@/components/shop/AddToCart'
import ProductGallery from '@/components/shop/ProductGallery'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export default async function ProductPage({ params, searchParams }: { params: unknown, searchParams?: unknown }) {
  const resolvedParams = (async (p: unknown) => {
    if (p && typeof (p as { then?: Function }).then === 'function') return await (p as Promise<Record<string, unknown>>)
    return p as Record<string, unknown>
  })(params)
  const resolvedSearch = searchParams && typeof (searchParams as { then?: Function }).then === 'function' ? await (searchParams as Promise<Record<string, unknown>>) : searchParams as Record<string, unknown> | undefined
  const rp = await resolvedParams
  const result = await getProductById(rp.id as string)
  if (!result) return <div>Product not found</div>

  const t = await getTranslations('shop')
  const current = await getCurrentUser()
  const isShop = !!current && (current.role === 'PROVIDER' || current.customerType === 'SHOP')

  if (result.kind === 'provider') {
    const pp: any = result.data as any
    const cp: any = pp.catalogProduct
    const provider: any = pp.provider
    const nameEN = cp?.nameEN || 'Product'
    const nameAR = cp?.nameAR || 'منتج'
    const price = isShop ? (pp.wholesalePrice ?? pp.sellingPrice) : (pp.retailPrice ?? pp.sellingPrice)
    const stockLabel = pp.stockQuantity > 0 ? t('inStock') : t('outOfStock')

    return (
      <section className="product-page container">
        <div className="product-breadcrumb">
          <Link href="/shop">{t('home')}</Link>
          <span>/</span>
          <span>{nameEN}</span>
        </div>

        <div className="product-layout">
          <div className="product-media-card">
            <ProductGallery images={cp?.images || []} productName={nameEN} />
          </div>

          <div className="product-info-stack">
            <div className="product-info-card">
              {provider && (
                <div className="product-provider-row">
                  {provider.logo ? (
                    <img src={provider.logo} alt={provider.shopNameEN || provider.shopNameAR} className="provider-logo-sm" />
                  ) : (
                    <div className="provider-logo-sm product-provider-avatar">
                      {(provider.shopNameEN || provider.shopNameAR || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="product-provider-name">
                      <Link href={`/shop/store/${provider.id}`}>
                        {provider.shopNameEN || provider.shopNameAR}
                      </Link>
                    </div>
                    <div className="product-provider-meta">
                      {provider.user?.nameEN || provider.user?.nameAR}
                    </div>
                  </div>
                </div>
              )}

              <div className="product-header-row">
                <div>
                  <h1>{nameEN}</h1>
                  <div className="product-card-subtitle">{nameAR}</div>
                  <div className="product-card-provider"><strong>{t('provider')}:</strong> {provider?.shopNameEN || provider?.shopNameAR}</div>
                </div>
              </div>

              <div className="product-price-block">
                <div className="product-price-meta">{t('price')}</div>
                <div className="price">{Number(price ?? 0).toLocaleString()} EGP</div>
              </div>

              <div className="product-detail-list">
                <div className="product-detail-item">
                  <strong>{t('status')}</strong>
                  <span>{stockLabel}</span>
                </div>
              </div>

              <AddToCart providerProductId={pp.id} className="product-page-cart" />
            </div>
          </div>
        </div>
      </section>
    )
  }

  const cp: any = result.data as any
  const provider: any = (result as any).provider
  const addedPP: any = resolvedSearch && (resolvedSearch as any).addedProviderProduct

  const nameEN = cp.nameEN || 'Product'
  const nameAR = cp.nameAR || 'منتج'
  const price = cp.defaultPrice || 0

  return (
    <section className="product-page container">
      <div className="product-breadcrumb">
        <Link href="/shop">{t('home')}</Link>
        <span>/</span>
        <span>{nameEN}</span>
      </div>

      <div className="product-layout">
        <div className="product-media-card">
          <ProductGallery images={cp.images || []} productName={nameEN} />
        </div>

        <div className="product-info-stack">
          <div className="product-info-card">
            <div className="product-header-row">
              <div>
                <h1>{nameEN}</h1>
                <div className="product-card-subtitle">{nameAR}</div>
                {provider && (
                  <div className="product-card-provider"><strong>{t('provider')}:</strong> {provider.shopNameEN || provider.shopNameAR}</div>
                )}
              </div>
            </div>

            <div className="product-price-block">
              <div className="price">{Number(price ?? 0).toLocaleString()} EGP</div>
              <div className="product-price-meta">{t('price')}</div>
            </div>

            {addedPP && (
              <div className="product-success-banner">
                ✅ {t('addedToCart')}: {String(addedPP)}
              </div>
            )}

            <div className="product-detail-list">
              <div className="product-detail-item">
                <strong>{t('status')}</strong>
                <span>{t('inStock')}</span>
              </div>
            </div>

            <AddToCart catalogProductId={cp.id} className="product-page-cart" />
          </div>
        </div>
      </div>
    </section>
  )
}
