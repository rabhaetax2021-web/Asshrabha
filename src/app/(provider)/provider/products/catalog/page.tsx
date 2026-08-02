import React from 'react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { listCatalogProducts, CatalogProductSortField } from '@/lib/actions/provider.actions'
import { prisma } from '@/lib/prisma'
import { getCatalogProductTitle, getCatalogProductAlternateName, getCatalogProductDescription } from '@/lib/i18n/catalog-product-display'

interface CatalogPageProps {
  searchParams?: { hideInventory?: string; category?: string; sortBy?: string; sortDir?: string }
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const hideInventory = String(searchParams?.hideInventory || '').toLowerCase() === '1'
  const category = String(searchParams?.category || '').trim()
  const sortBy = (String(searchParams?.sortBy || 'createdAt') || 'createdAt') as CatalogProductSortField
  const sortDir = String(searchParams?.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const locale = String(await getLocale() || '')
  const isArabic = locale.startsWith('ar')
  const t = await getTranslations('provider')
  const tc = await getTranslations('common')

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, nameEN: true, nameAR: true, slug: true },
  })

  let excludeCatalogProductIds: string[] = []
  if (hideInventory) {
    const currentUser = await getCurrentUser()
    if (currentUser?.role === 'PROVIDER') {
      const providerProfile = await prisma.providerProfile.findUnique({ where: { userId: currentUser.id } })
      if (providerProfile) {
        const providerProducts = await prisma.providerProduct.findMany({
          where: { providerId: providerProfile.id },
          select: { catalogProductId: true },
        })
        excludeCatalogProductIds = providerProducts.map((p) => p.catalogProductId)
      }
    }
  }

  const products = await listCatalogProducts({
    excludeCatalogProductIds,
    categorySlug: category || undefined,
    sortBy,
    sortDir,
  })

  return (
    <section className="provider-catalog container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h1>{t('catalogBrowser')}</h1>
          <p className="text-muted">{t('selectFromCatalog')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/provider/suggestions" className="btn btn-secondary">{t('suggestProduct') || 'Suggest New Catalog Product'}</Link>
        </div>
      </div>
      <form method="get" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {t('categoryLabel') || tc('categoryLabel')}
          <select name="category" defaultValue={category} className="input" style={{ minWidth: 180 }}>
            <option value="">{tc('allCategories') || 'All categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{cat.nameEN || cat.nameAR}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {t('sortBy') || tc('sortBy')}
          <select name="sortBy" defaultValue={sortBy} className="input" style={{ minWidth: 180 }}>
            <option value="createdAt">{t('sortNewest') || 'Newest'}</option>
            <option value="nameEN">{t('sortName') || 'Name'}</option>
            <option value="wholesaleMinPrice">{t('sortWholesalePrice') || 'Wholesale price'}</option>
            <option value="retailMinPrice">{t('sortRetailPrice') || 'Retail price'}</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {t('sortDirection') || 'Direction'}
          <select name="sortDir" defaultValue={sortDir} className="input" style={{ minWidth: 140 }}>
            <option value="desc">{t('sortDesc') || 'Descending'}</option>
            <option value="asc">{t('sortAsc') || 'Ascending'}</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 220 }}>
          <input type="checkbox" name="hideInventory" value="1" defaultChecked={hideInventory} />
          <span>{t('hideInventoryLabel') || 'Show only products not in my inventory'}</span>
        </label>
        <button type="submit" className="btn btn-primary">{tc('applyFilters') || 'Apply filters'}</button>
        <div style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {products.length} {tc('productCount') ? tc('productCount', { count: products.length, plural: products.length === 1 ? '' : 's' }) : `product${products.length === 1 ? '' : 's'}`}
        </div>
      </form>
      <div className="catalog-grid">
        {products.map(p => (
          <div key={p.id} className="catalog-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)' }}>
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0]} alt={p.nameEN || p.nameAR} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }} />
            ) : (
              <div style={{ width: '100%', height: 160, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)' }}>📦</div>
            )}
            <h3 style={{ marginBottom: 8 }}>
              {getCatalogProductTitle(p, locale) || t('product') || 'Untitled product'}
            </h3>
            {getCatalogProductAlternateName(p, locale) ? (
              <div style={{ marginBottom: 8, color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                {getCatalogProductAlternateName(p, locale)}
              </div>
            ) : null}
            <p style={{ marginBottom: 10, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
              {getCatalogProductDescription(p, locale) || t('noDescription') || 'No description available.'}
            </p>
            <div style={{ display: 'grid', gap: 6, marginBottom: 'var(--space-3)' }}>
              <div><strong>{t('wholesaleRange') || 'Wholesale range:'}</strong> {p.wholesaleMinPrice} - {p.wholesaleMaxPrice} EGP</div>
              <div><strong>{t('retailRange') || 'Retail range:'}</strong> {p.retailMinPrice} - {p.retailMaxPrice} EGP</div>
              <div><strong>{t('unitType') || 'Unit type:'}</strong> {p.unitType}</div>
            </div>
            <a href={`/provider/products/catalog/${p.id}`} className="btn btn-primary" style={{ display: 'inline-block', marginTop: 'var(--space-2)' }}>{t('viewDetails') || 'View details'}</a>
          </div>
        ))}
      </div>
    </section>
  )
}
