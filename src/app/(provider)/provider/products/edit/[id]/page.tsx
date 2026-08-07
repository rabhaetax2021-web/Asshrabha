import React from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import EditProductForm from '@/components/provider/EditProductForm'

type Props = { params: Promise<{ id: string }> | { id: string } }

export default async function EditProductPage({ params }: Props) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id
    if (!id) {
      // Missing id — render a friendly message instead of redirecting (avoid NEXT_REDIRECT being thrown)
      return (
        <div className="container">
          <Card>
            <p>Missing product id.</p>
          </Card>
        </div>
      )
    }
    const prod = await prisma.providerProduct.findUnique({ where: { id }, include: { catalogProduct: true } })
    if (!prod) return <div className="container"><Card><p>Product not found.</p></Card></div>

  const initial = {
    id: prod.id,
    wholesalePrice: prod.wholesalePrice,
    retailPrice: prod.retailPrice,
    stockQuantity: prod.stockQuantity,
    minPurchaseQuantity: prod.minPurchaseQuantity ?? '',
    maxPurchaseQuantity: prod.maxPurchaseQuantity ?? '',
    wholesaleMinPrice: prod.catalogProduct?.wholesaleMinPrice ?? 0,
    wholesaleMaxPrice: prod.catalogProduct?.wholesaleMaxPrice ?? 0,
    retailMinPrice: prod.catalogProduct?.retailMinPrice ?? 0,
    retailMaxPrice: prod.catalogProduct?.retailMaxPrice ?? 0,
  }

  return (
    <section className="provider-product-edit container">
      <h1>Edit Product</h1>
      <Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          <div>
            <h3>{prod.catalogProduct?.nameEN || prod.catalogProduct?.nameAR}</h3>
            <EditProductForm initial={initial} />
          </div>
          <aside>
            <img src={prod.catalogProduct?.images?.[0] || ''} alt={prod.catalogProduct?.nameEN || ''} style={{ width: '100%', borderRadius: '8px' }} />
          </aside>
        </div>
      </Card>
    </section>
  )
  } catch (err) {
    // If Next triggered a redirect, re-throw so the App Router handles it.
    const msg = String((err as any)?.message || err || '')
    if (msg.includes('NEXT_REDIRECT') || msg.includes('Redirect')) throw err

    // Log other server errors and show a friendly message in dev
    console.error('[EditProductPage] error', err)
    return (
      <div className="container">
        <Card>
          <h2>Server error</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String((err as any)?.message || err)}</pre>
          <p>Please check the server logs for details.</p>
        </Card>
      </div>
    )
  }
}
