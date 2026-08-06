import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import IntlText from '@/components/IntlText'
import CatalogList from '@/components/admin/CatalogList'
import CatalogImportExport from '@/components/admin/CatalogImportExport'
import AdminCategoryFilter from '@/components/admin/AdminCategoryFilter'

export default async function AdminCatalogPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params: Record<string, string | string[] | undefined> = await (async () => {
    if (!searchParams) return {}
    if (typeof (searchParams as { then?: Function }).then === 'function') {
      return await searchParams
    }
    return searchParams
  })()

  const categoryFilter = (params?.category || '').toString()
  const storeFilter = (params?.store || '').toString()

  // Fetch categories and providers for the filter UI
  const allCategories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } })
  const providers = await prisma.providerProfile.findMany({ orderBy: { shopNameEN: 'asc' }, select: { id: true, shopNameEN: true, shopNameAR: true } })

  // Build query with optional filters
  const where: any = { status: { not: 'ARCHIVED' } }
  if (categoryFilter) where.category = { slug: categoryFilter }
  if (storeFilter) where.providerProducts = { some: { providerId: storeFilter } }

  const products = await prisma.catalogProduct.findMany({ where, orderBy: { createdAt: 'desc' } })

  return (
    <section className="admin-catalog container">
      <div className="admin-page-header">
        <h1><IntlText ns="admin" id="catalog" /></h1>
        <div className="admin-catalog-actions">
          <Link href="/admin/catalog/new" className="btn"><IntlText ns="admin" id="createCategory" /></Link>
          <CatalogImportExport />
          <Link href="/admin/catalog/new-product" className="btn primary"><IntlText ns="admin" id="createProduct" /></Link>
        </div>
      </div>

      <AdminCategoryFilter allCategories={allCategories} providers={providers} currentSlug={categoryFilter} productCount={products.length} />

      <CatalogList products={products} />
    </section>
  )
}
