import { getProductById } from '@/lib/actions/shop.actions'
import React from 'react'
import AddToCart from '@/components/shop/AddToCart'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'

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
      const conditionText = pp.providerProductOptions && pp.providerProductOptions.length > 0
        ? `Provider options: ${pp.providerProductOptions.map((opt: any) => opt.unitType).join(', ')}`
        : 'Provider conditions will be shown here when available.'

    return (
      <section className="product-page container">
        <div className="product-layout">
          <div>
            {cp?.images && cp.images.length > 0 ? (
              <div className="photo-gallery">
                {cp.images.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt={`${nameEN} ${idx + 1}`} />
                ))}
              </div>
            ) : (
              <div className="product-image-placeholder" style={{ maxWidth: 540, margin: '0 auto' }}>
                📦
              </div>
            )}
          </div>

          <div>
            {provider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                {provider.logo ? (
                  <img src={provider.logo} alt={provider.shopNameEN || provider.shopNameAR} className="provider-logo-sm" />
                ) : (
                  <div className="provider-logo-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', fontWeight: 'var(--font-bold)' }}>
                    {(provider.shopNameEN || provider.shopNameAR || 'S').charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                    <Link href={`/shop/store/${provider.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {provider.shopNameEN || provider.shopNameAR}
                    </Link>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)' }}>
                    {provider.user?.nameEN || provider.user?.nameAR}
                  </div>
                </div>
              </div>
            )}

            <h1>{nameEN}</h1>
            <div className="product-card-subtitle">{nameAR}</div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 'var(--leading-relaxed)' }}>
              {descriptionEN}
            </p>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--text-sm)' }}>
              {descriptionAR}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <div className="price" style={{ fontSize: 'var(--text-4xl)' }}>
                {isShop ? (pp.wholesalePrice ?? pp.sellingPrice) : (pp.retailPrice ?? pp.sellingPrice)} EGP / {unit}
              </div>
              {pp.stockQuantity > 0 ? (
                <span className="badge badge-success">In Stock {pp.stockQuantity}</span>
              ) : (
                <span className="badge badge-error">Out of Stock</span>
              )}
              {!isShop && Number(pp.retailPrice) > 0 && (
                <span className="badge badge-primary">Retail: {pp.retailPrice} EGP</span>
              )}
            </div>
            <div className="product-card-condition" style={{ marginBottom: 'var(--space-6)' }}>
              {conditionText}
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
      <div className="product-layout">
        <div>
          {cp.images && cp.images.length > 0 ? (
            <div className="photo-gallery">
              {cp.images.map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`${nameEN} ${idx + 1}`} />
              ))}
            </div>
          ) : (
            <div className="product-image-placeholder" style={{ maxWidth: 540, margin: '0 auto' }}>
              📦
            </div>
          )}
        </div>

        <div>
          <h1>{nameEN}</h1>
          <div className="product-card-subtitle">{nameAR}</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', lineHeight: 'var(--leading-relaxed)' }}>
            {descriptionEN}
          </p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 'var(--leading-relaxed)', fontSize: 'var(--text-sm)' }}>
            {descriptionAR}
          </p>

          {addedPP && (
            <div className="badge badge-success" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
              ✅ Added listing: {String(addedPP)}
            </div>
          )}

          <div className="price" style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>
            Price unit: {unit}
          </div>
          <div className="product-card-condition" style={{ marginBottom: 'var(--space-6)' }}>
            {conditionText}
          </div>

          <AddToCart catalogProductId={cp.id} />
        </div>
      </div>
    </section>
  )
}
