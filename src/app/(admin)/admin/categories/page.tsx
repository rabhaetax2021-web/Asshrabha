import React from "react";
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import CategoryManager from '@/components/admin/CategoryManager'
import { getCurrentUser } from '@/lib/auth'

export default async function CategoriesPage() {
  const current = await getCurrentUser()
  if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
    return <div className="container">Unauthorized</div>
  }

  const categories = await prisma.category.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { _count: { select: { products: true } } },
  })

  return (
    <section className="admin-categories container">
      <div className="admin-page-header">
        <h1>Categories</h1>
        <div className="admin-catalog-actions">
          <Link href="/admin/categories/new" className="btn primary">Add New Category</Link>
        </div>
      </div>

      <CategoryManager initialCategories={categories.map((category) => ({
        id: category.id,
        nameEN: category.nameEN,
        nameAR: category.nameAR,
        slug: category.slug,
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
        _count: category._count,
      }))} />
    </section>
  );
}

