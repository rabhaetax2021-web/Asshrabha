import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import IntlText from '@/components/IntlText'
import CatalogList from '@/components/admin/CatalogList'

export default async function AdminCatalogPage() {
  const products = await prisma.catalogProduct.findMany({ where: { status: { not: 'ARCHIVED' } }, orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <section className="admin-catalog container">
      <div className="admin-page-header">
        <h1><IntlText ns="admin" id="catalog" /></h1>
        <div className="admin-catalog-actions">
          <Link href="/admin/catalog/new" className="btn"><IntlText ns="admin" id="createCategory" /></Link>
          <Link href="/admin/catalog/new-product" className="btn primary"><IntlText ns="admin" id="createProduct" /></Link>
        </div>
      </div>
      <CatalogList products={products} />
    </section>
  )
}
