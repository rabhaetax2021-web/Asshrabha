import React from 'react'
import { prisma } from '@/lib/prisma'
import Card from '@/components/ui/Card'
import EditProductForm from '@/components/provider/EditProductForm'

type Props = { params: { id: string } }

export default async function EditProductPage({ params }: Props) {
  const id = params.id
  const prod = await prisma.providerProduct.findUnique({ where: { id }, include: { catalogProduct: true } })
  if (!prod) return <div className="container"><Card><p>Product not found.</p></Card></div>

  const initial = { id: prod.id, sellingPrice: prod.sellingPrice, wholesalePrice: prod.wholesalePrice, retailPrice: prod.retailPrice, stockQuantity: prod.stockQuantity }

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
}
