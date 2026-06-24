import React from "react";
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })

  return (
    <section className="admin-categories container">
      <div className="admin-page-header">
        <h1>Categories</h1>
        <div className="admin-catalog-actions">
          <Link href="/admin/categories/new" className="btn primary">Add New Category</Link>
        </div>
      </div>

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="hide-sm">Slug</th>
              <th className="hide-sm">Created</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={3}>No categories found.</td>
              </tr>
            )}

            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.nameEN || c.nameAR || '-'}</td>
                <td>{c.slug}</td>
                <td>{new Date(c.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

