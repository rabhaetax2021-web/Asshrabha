import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import NewProductForm from '@/components/admin/NewProductForm'

type CategoryOption = { id: string; nameEN: string | null; nameAR: string | null }

export default async function EditCatalogProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!id) return (
    <section className="admin-catalog container">
      <h1>Invalid product id</h1>
      <p><Link href="/admin/catalog">← Back to Catalog</Link></p>
    </section>
  )
  const product = await prisma.catalogProduct.findUnique({ where: { id } })
  if (!product) return (
    <section className="admin-catalog container">
      <h1>Product not found</h1>
      <p><Link href="/admin/catalog">← Back to Catalog</Link></p>
    </section>
  )

  const cats = await prisma.category.findMany({ orderBy: { nameEN: 'asc' }, take: 200 })
  const categories: CategoryOption[] = cats.map(c => ({ id: c.id, nameEN: c.nameEN, nameAR: c.nameAR }))

  return (
    <section className="admin-catalog container">
      <h1>Edit Catalog Product</h1>
      <div>
        <NewProductForm categories={categories} initial={product} />
      </div>
      <p><Link href="/admin/catalog">← Back to Catalog</Link></p>
    </section>
  )
}
