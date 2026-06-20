import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import IntlText from '@/components/IntlText'

export default async function AdminCatalogPage() {
  const products = await prisma.catalogProduct.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })

  return (
    <section className="admin-catalog container">
      <div className="admin-page-header">
        <h1><IntlText ns="admin" id="catalog" /></h1>
        <div className="admin-catalog-actions">
          <Link href="/admin/catalog/new" className="btn"><IntlText ns="admin" id="createCategory" /></Link>
          <Link href="/admin/catalog/new-product" className="btn primary"><IntlText ns="admin" id="createProduct" /></Link>
        </div>
      </div>
      <div className="catalog-list">
        {products.map(p => (
          <div key={p.id} className="catalog-item" style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center', padding: 'var(--space-4)', borderBottom: '1px solid var(--border-light)' }}>
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0]} alt={p.nameEN || p.nameAR} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-xl)' }}>📦</div>
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: 4 }}><Link href={`/admin/catalog/${p.id}`}>{p.nameEN || p.nameAR}</Link></h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Wholesale: {p.wholesaleMinPrice || p.minimumPrice} - {p.wholesaleMaxPrice || p.maximumPrice} EGP
                {Number(p.retailMinPrice) > 0 || Number(p.retailMaxPrice) > 0 ? (
                  <span style={{ marginLeft: 'var(--space-3)' }}>Retail: {p.retailMinPrice} - {p.retailMaxPrice} EGP</span>
                ) : null}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
