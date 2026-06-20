import { getProductById } from '@/lib/actions/shop.actions'
import React from 'react'
import AddToCart from '@/components/shop/AddToCart'
import Link from 'next/link'

export default async function ProductPage({ params, searchParams }: { params: any, searchParams?: any }) {
  const resolvedParams = await params
  const resolvedSearch = searchParams && typeof (searchParams as any).then === 'function' ? await searchParams : searchParams
  const result = await getProductById(resolvedParams.id)
  if (!result) return <div>Product not found</div>

  // If provider product, show listing details (price, stock, provider info)
  if (result.kind === 'provider') {
    const pp = result.data as any
    const cp = pp.catalogProduct
    const provider = pp.provider
    return (
      <section className="product-page container">
        <div style={{ display: 'grid', gap: 'var(--space-8)', gridTemplateColumns: '1fr', marginTop: 'var(--space-4)' }}>
          {/* Left: Photos */}
          <div>
            {cp?.images && cp.images.length > 0 ? (
              <div className="photo-gallery">
                {cp.images.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt={`${cp.nameEN || cp.nameAR || 'Product'} ${idx + 1}`} />
                ))}
              </div>
            ) : (
              <div className="product-image-placeholder" style={{ maxWidth: 400, margin: '0 auto', aspectRatio: '1', borderRadius: 'var(--radius-xl)', fontSize: 'var(--text-5xl)' }}>
                📦
              </div>
            )}
          </div>

          {/* Right: Info */}
          <div>
            {/* Provider badge */}
            {provider && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                {provider.logo ? (
                  <img src={provider.logo} alt="" className="provider-logo-sm" />
                ) : (
                  <div className="provider-logo-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', color: 'white', fontWeight: 'var(--font-bold)', fontSize: 'var(--text-xs)' }}>
                    {(provider.shopNameEN || provider.shopNameAR || 'S')?.charAt(0).toUpperCase()}
                  </div>
                )}
                <Link href={`/shop/store/${provider.id}`} style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 'var(--font-semibold)', textDecoration: 'none' }}>
                  {provider.shopNameEN || provider.shopNameAR}
                </Link>
              </div>
            )}

            <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
              {cp?.nameEN || cp?.nameAR || 'Product'}
            </h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
              {cp?.descriptionEN || cp?.descriptionAR || 'No description available.'}
            </p>

            <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'baseline', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <div className="price" style={{ fontSize: 'var(--text-3xl)' }}>
              {pp.wholesalePrice || pp.sellingPrice} EGP
            </div>
            {Number(pp.retailPrice) > 0 && (
              <span className="badge" style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}>
                Retail: {pp.retailPrice} EGP
              </span>
            )}
              {pp.stockQuantity > 0 ? (
                <span className="badge badge-success" style={{ fontSize: 'var(--text-xs)' }}>
                  In Stock ({pp.stockQuantity})
                </span>
              ) : (
                <span className="badge badge-error" style={{ fontSize: 'var(--text-xs)' }}>
                  Out of Stock
                </span>
              )}
            </div>

            <AddToCart providerProductId={pp.id} />
          </div>
        </div>
      </section>
    )
  }

  // catalog product view
  const cp = result.data as any
  const addedPP = resolvedSearch?.addedProviderProduct

  return (
    <section className="product-page container">
      <div style={{ display: 'grid', gap: 'var(--space-8)', gridTemplateColumns: '1fr', marginTop: 'var(--space-4)' }}>
        <div>
          {cp.images && cp.images.length > 0 ? (
            <div className="photo-gallery">
              {cp.images.map((img: string, idx: number) => (
                <img key={idx} src={img} alt={`${cp.nameEN || cp.nameAR} ${idx + 1}`} />
              ))}
            </div>
          ) : (
            <div className="product-image-placeholder" style={{ maxWidth: 400, margin: '0 auto', aspectRatio: '1', borderRadius: 'var(--radius-xl)', fontSize: 'var(--text-5xl)' }}>
              📦
            </div>
          )}
        </div>

        <div>
          <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-3)', color: 'var(--text-primary)' }}>
            {cp.nameEN || cp.nameAR}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)', lineHeight: 'var(--leading-relaxed)' }}>
            {cp.descriptionEN || cp.descriptionAR || 'No description available.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'baseline', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
            <div className="price" style={{ fontSize: 'var(--text-3xl)' }}>
              {cp.minimumPrice} - {cp.maximumPrice} EGP
            </div>
          </div>
          {addedPP && (
            <div className="badge badge-success" style={{ marginBottom: 'var(--space-4)', display: 'inline-block' }}>
              ✅ Added listing: {String(addedPP)}
            </div>
          )}
          <AddToCart catalogProductId={cp.id} />
        </div>
      </div>
    </section>
  )
}
