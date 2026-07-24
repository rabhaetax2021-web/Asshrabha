import { getProductById } from '@/lib/actions/shop.actions'
import React from 'react'
import AddToCart from '@/components/shop/AddToCart'
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

  const current = await getCurrentUser()
  const isShop = !!current && (current.role === 'PROVIDER' || current.customerType === 'SHOP')

  if (result.kind === 'provider') {
    const pp: any = result.data as any
    const cp: any = pp.catalogProduct
    const provider: any = pp.provider
    const nameEN = cp?.nameEN || 'Product'
    const nameAR = cp?.nameAR || 'منتج'
    const descriptionEN = cp?.descriptionEN || 'No description available.'
    const descriptionAR = cp?.descriptionAR || 'لا توجد تفاصيل.'
    const unit = pp.wholesaleUnit || cp?.unitType || 'UNIT'
    const unitPrice = isShop ? (pp.wholesalePrice ?? pp.sellingPrice) : (pp.retailPrice ?? pp.sellingPrice)
    // Build a more robust condition display: prefer provider options, fall back to catalog unit ranges or provider defaults
    const providerOptionUnits = (pp.providerProductOptions || []).map((opt: any) => opt.unitType).filter(Boolean)
    const catalogUnitRanges = (pp.catalogProduct?.unitRanges || []).map((r: any) => r.unitType).filter(Boolean)
    const providerDefault = pp.provider?.defaultWholesaleUnit ? [pp.provider.defaultWholesaleUnit] : []
    const conditionUnits = providerOptionUnits.length > 0 ? providerOptionUnits : (catalogUnitRanges.length > 0 ? catalogUnitRanges : providerDefault)
    const conditionText = conditionUnits && conditionUnits.length > 0
      ? `Provider options: ${conditionUnits.join(', ')}`
      : 'Provider conditions will be shown here when available.'
    const stockLabel = pp.stockQuantity > 0 ? `In stock · ${pp.stockQuantity}` : 'Out of stock'

    const t = await getTranslations('shop')

    return (
      <section className="product-page container">
        <div className="product-breadcrumb">
          <Link href="/shop">Shop</Link>
          <span>/</span>
          <span>Products</span>
          <span>/</span>
          <span>{nameEN}</span>
        </div>

        <div className="product-layout">
          <div className="product-media-card">
            {cp?.images && cp.images.length > 0 ? (
              <div className="image-gallery">
                <div className="image-gallery-main">
                  <img src={cp.images[0]} alt={`${nameEN} main`} />
                </div>
                <div className="image-gallery-thumbs">
                  {cp.images.map((img: string, idx: number) => (
                    <div key={idx} className="image-gallery-thumb">
                      <img src={img} alt={`${nameEN} ${idx + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="product-image-placeholder">
                📦
              </div>
            )}
            <div className="product-media-footer">
              <span className="product-chip">Trending now</span>
              <span className="product-chip product-chip-accent">Verified seller</span>
            </div>
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
                  <div className="product-eyebrow">Marketplace favorite</div>
                  <h1>{nameEN}</h1>
                  <div className="product-card-subtitle">{nameAR}</div>
                </div>
                <span className="product-status-pill">Top deal</span>
              </div>

              <div className="product-meta-row">
                <span className="product-pill">Free delivery</span>
                <span className="product-pill">Secure payment</span>
                <span className="product-pill">Easy returns</span>
              </div>

              <div className="product-price-block">
                <div className="price">{Number(unitPrice ?? 0).toLocaleString()} EGP / {unit}</div>
                <div className="product-price-meta">{isShop ? 'Wholesale price' : 'Retail price'} · {stockLabel}</div>
              </div>

              <div className="product-description-block">
                <p>{descriptionEN}</p>
                <p className="product-description-ar">{descriptionAR}</p>
              </div>

              <div className="product-detail-list">
                <div className="product-detail-item">
                  <strong>{t('condition') || 'Condition'}</strong>
                  <span>{conditionText}</span>
                </div>
                {provider && (provider.minOrderItems || provider.minOrderAmount) && (
                  <div className="product-detail-item">
                    <strong>{t('providerConditions') || 'Provider conditions'}</strong>
                    <span>
                      {provider.minOrderItems ? `${t('minOrderItems') || 'Minimum items'}: ${provider.minOrderItems}` : null}
                      {provider.minOrderItems && provider.minOrderAmount ? ' · ' : null}
                      {provider.minOrderAmount ? `${t('minOrderAmount') || 'Minimum amount'}: ${Number(provider.minOrderAmount).toFixed(2)} EGP` : null}
                    </span>
                  </div>
                )}
                {!isShop && Number(pp.retailPrice) > 0 && (
                  <div className="product-detail-item">
                    <strong>Retail</strong>
                    <span>{pp.retailPrice} EGP</span>
                  </div>
                )}
              </div>
            </div>

            <div className="product-cta-card">
              <div className="product-cta-top">
                <span className="product-cta-chip">Available now</span>
                <span className="product-cta-chip product-cta-chip-alt">Fast pickup</span>
              </div>
              <div className="product-cta-price">{Number(unitPrice ?? 0).toLocaleString()} EGP</div>
              <AddToCart providerProductId={pp.id} className="product-page-cart" />
              <div className="product-cta-features">
                <div>🚚 Fast delivery</div>
                <div>🔒 Protected checkout</div>
                <div>⭐ Trusted provider</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  const cp: any = result.data as any
  const addedPP: any = resolvedSearch && (resolvedSearch as any).addedProviderProduct

  const nameEN = cp.nameEN || 'Product'
  const nameAR = cp.nameAR || 'منتج'
  const descriptionEN = cp.descriptionEN || 'No description available.'
  const descriptionAR = cp.descriptionAR || 'لا توجد تفاصيل.'
  const unit = cp.unitRanges?.[0]?.unitType || cp.unitType || 'UNIT'
  const conditionText = cp.unitRanges && cp.unitRanges.length > 0
    ? `Available units: ${cp.unitRanges.map((range: any) => range.unitType).join(', ')}`
    : 'Provider conditions will be shown on the listing page.'

  return (
    <section className="product-page container">
      <div className="product-breadcrumb">
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <span>Catalog</span>
        <span>/</span>
        <span>{nameEN}</span>
      </div>

      <div className="product-layout">
        <div className="product-media-card">
          {cp.images && cp.images.length > 0 ? (
            <div className="image-gallery">
              <div className="image-gallery-main">
                <img src={cp.images[0]} alt={`${nameEN} main`} />
              </div>
              <div className="image-gallery-thumbs">
                {cp.images.map((img: string, idx: number) => (
                  <div key={idx} className="image-gallery-thumb">
                    <img src={img} alt={`${nameEN} ${idx + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="product-image-placeholder">
              📦
            </div>
          )}
          <div className="product-media-footer">
            <span className="product-chip">Fresh listing</span>
            <span className="product-chip product-chip-accent">Curated catalog</span>
          </div>
        </div>

        <div className="product-info-stack">
          <div className="product-info-card">
            <div className="product-header-row">
              <div>
                <div className="product-eyebrow">New arrival</div>
                <h1>{nameEN}</h1>
                <div className="product-card-subtitle">{nameAR}</div>
              </div>
              <span className="product-status-pill">Best value</span>
            </div>

            <div className="product-meta-row">
              <span className="product-pill">Price listed</span>
              <span className="product-pill">Flexible units</span>
              <span className="product-pill">Instant add</span>
            </div>

            <div className="product-description-block">
              <p>{descriptionEN}</p>
              <p className="product-description-ar">{descriptionAR}</p>
            </div>

            {addedPP && (
              <div className="product-success-banner">
                ✅ Added listing: {String(addedPP)}
              </div>
            )}

            <div className="product-detail-list">
              <div className="product-detail-item">
                <strong>Unit</strong>
                <span>{unit}</span>
              </div>
              <div className="product-detail-item">
                <strong>Availability</strong>
                <span>{conditionText}</span>
              </div>
            </div>
          </div>

          <div className="product-cta-card">
            <div className="product-cta-top">
              <span className="product-cta-chip">Ready to shop</span>
              <span className="product-cta-chip product-cta-chip-alt">Quick cart</span>
            </div>
            <div className="product-cta-price">{unit}</div>
            <AddToCart catalogProductId={cp.id} className="product-page-cart" />
            <div className="product-cta-features">
              <div>⚡ Instant add to cart</div>
              <div>🛡️ Trusted catalog item</div>
              <div>📦 Multiple unit options</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
