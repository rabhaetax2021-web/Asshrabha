import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { getLocale, getTranslations } from 'next-intl/server'
import { getCurrentUser } from '@/lib/auth'
import { listCatalogProducts, CatalogProductSortField } from '@/lib/actions/provider.actions'
import { prisma } from '@/lib/prisma'
import { getCatalogProductTitle, getCatalogProductAlternateName, getCatalogProductDescription, isArabicLocale } from '@/lib/i18n/catalog-product-display'

interface CatalogPageProps {
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>
}

function resolveSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[value.length - 1] || ''
  return String(value || '')
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params: Record<string, string | string[] | undefined> = await (async () => {
    if (!searchParams) return {}
    if (typeof (searchParams as { then?: Function }).then === 'function') {
      return await searchParams
    }
    return searchParams
  })()

  const hideInventory = typeof params.hideInventory === 'undefined'
    ? true
    : ['1', 'true', 'on', 'yes'].includes(resolveSearchValue(params.hideInventory).toLowerCase())
  const category = resolveSearchValue(params.category).trim()
  const sortByInput = resolveSearchValue(params.sortBy || 'createdAt')
  const sortBy = ['createdAt', 'nameEN', 'wholesaleMinPrice', 'retailMinPrice'].includes(sortByInput)
    ? (sortByInput as CatalogProductSortField)
    : 'createdAt'
  const sortDir = resolveSearchValue(params.sortDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  const locale = String(await getLocale() || '')
  const localeToUse = await (async () => {
    try {
      const cookieStore = await cookies()
      const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
      if (localeCookie) return localeCookie
    } catch {
      // ignore
    }
    return locale || 'ar'
  })()
  const isArabic = isArabicLocale(localeToUse)
  const t = await getTranslations('provider')
  const tc = await getTranslations('common')

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, nameEN: true, nameAR: true, slug: true },
  })

  const filterControlStyle = {
    minWidth: 180,
    padding: '0.85rem 1rem',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    appearance: 'none',
  } as const

  const buttonPrimaryStyle = {
    background: 'var(--primary)',
    color: 'var(--text-inverse)',
    border: '1px solid var(--primary)',
    borderRadius: 'var(--radius-md)',
    padding: '0.9rem 1.25rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as const

  const buttonSecondaryStyle = {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-md)',
    padding: '0.9rem 1.25rem',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
  } as const

  const filterFormStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    marginBottom: 'var(--space-4)',
  } as const

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 220,
    color: 'var(--text-primary)',
  } as const

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h1>{t('catalogBrowser')}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{t('selectFromCatalog')}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/provider/suggestions" style={buttonSecondaryStyle}>{t('suggestProduct') || 'Suggest New Catalog Product'}</Link>
        </div>
      </div>
      <form method="get" style={filterFormStyle}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
          {t('categoryLabel') || tc('categoryLabel')}
          <select name="category" defaultValue={category} style={filterControlStyle}>
            <option value="">{tc('allCategories') || 'All categories'}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>{isArabic ? cat.nameAR || cat.nameEN : cat.nameEN || cat.nameAR}</option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
          {t('sortBy') || tc('sortBy')}
          <select name="sortBy" defaultValue={sortBy} style={filterControlStyle}>
            <option value="createdAt">{t('sortNewest') || 'Newest'}</option>
            <option value="nameEN">{t('sortName') || 'Name'}</option>
            <option value="wholesaleMinPrice">{t('sortWholesalePrice') || 'Wholesale price'}</option>
            <option value="retailMinPrice">{t('sortRetailPrice') || 'Retail price'}</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
          {t('sortDirection') || 'Direction'}
          <select name="sortDir" defaultValue={sortDir} style={filterControlStyle}>
            <option value="desc">{t('sortDesc') || 'Descending'}</option>
            <option value="asc">{t('sortAsc') || 'Ascending'}</option>
          </select>
        </label>
        <label style={checkboxLabelStyle}>
          <input type="hidden" name="hideInventory" defaultValue="0" />
          <input type="checkbox" name="hideInventory" value="1" defaultChecked={hideInventory} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
          <span>{t('hideInventoryLabel') || 'Show only products not in my inventory'}</span>
        </label>
        <button type="submit" style={buttonPrimaryStyle}>{tc('applyFilters') || 'Apply filters'}</button>
        <div style={{ color: 'var(--text-secondary)', marginLeft: 'auto', minWidth: 120, textAlign: 'right' }}>
          {tc('productCount', { count: products.length, plural: isArabic ? '' : products.length === 1 ? '' : 's' })}
        </div>
      </form>
      <div className="catalog-grid" style={{ maxWidth: '100%' }}>
        {products.map(p => (
          <div key={p.id} className="catalog-card" style={{ padding: 'var(--space-4)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', minHeight: 420, display: 'flex', flexDirection: 'column', background: 'var(--bg-elevated)', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)' }}>
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0]} alt={p.nameEN || p.nameAR} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-3)' }} />
            ) : (
              <div style={{ width: '100%', height: 180, borderRadius: 'var(--radius-md)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>📦</div>
            )}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ marginBottom: 8, color: 'var(--text-primary)', fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.2 }}>
                {getCatalogProductTitle(p, localeToUse) || t('product') || 'Untitled product'}
              </h3>
              {getCatalogProductAlternateName(p, localeToUse) ? (
                <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  {getCatalogProductAlternateName(p, localeToUse)}
                </div>
              ) : null}
              <p style={{ marginBottom: 10, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {getCatalogProductDescription(p, localeToUse) || t('noDescription') || 'No description available.'}
              </p>
              <div style={{ display: 'grid', gap: 6, marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <div><strong style={{ color: 'var(--text-primary)' }}>{t('wholesaleRange') || 'Wholesale range:'}</strong> {p.wholesaleMinPrice} - {p.wholesaleMaxPrice} EGP</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>{t('retailRange') || 'Retail range:'}</strong> {p.retailMinPrice} - {p.retailMaxPrice} EGP</div>
                <div><strong style={{ color: 'var(--text-primary)' }}>{t('unitType') || 'Unit type:'}</strong> {p.unitType}</div>
              </div>
            </div>
            <a href={`/provider/products/catalog/${p.id}`} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginTop: 'auto', background: 'var(--primary)', color: 'var(--text-inverse)', borderRadius: 'var(--radius-md)', padding: '0.95rem 1.25rem', textDecoration: 'none', fontWeight: 600 }}>{t('viewDetails') || 'View details'}</a>
          </div>
        ))}
      </div>
    </section>
  )
}
