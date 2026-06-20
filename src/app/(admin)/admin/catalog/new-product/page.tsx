import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import NewProductForm from '@/components/admin/NewProductForm'

type CategoryOption = { id: string; nameEN: string | null; nameAR: string | null }

export default async function NewCatalogProductPage() {
  const cats = await prisma.category.findMany({ orderBy: { nameEN: 'asc' }, take: 200 })
  const categories: CategoryOption[] = cats.map(c => ({ id: c.id, nameEN: c.nameEN, nameAR: c.nameAR }))

  return (
    <section className="admin-catalog container">
      <h1>Create Catalog Product</h1>
      <div>
        {/* Server -> Client prop */}
        <NewProductForm categories={categories} />
      </div>
      <p><Link href="/admin/catalog">← Back to Catalog</Link></p>
    </section>
  )
}

