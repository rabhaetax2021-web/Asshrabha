"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'

interface PreviewProduct {
  categoryId: string
  nameEN: string
  nameAR: string
  descriptionEN: string
  descriptionAR: string
  wholesaleMinPrice: number
  wholesaleMaxPrice: number
  retailMinPrice: number
  retailMaxPrice: number
  unitType: string
  status: string
  images: string[]
  rowNumber?: number
}

interface CategoryOption { id: string; nameEN?: string | null; nameAR?: string | null }

export default function CatalogImportPage() {
  const locale = useLocale()
  const t = useTranslations('admin')
  const [products, setProducts] = useState<PreviewProduct[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [duplicates, setDuplicates] = useState<Array<{ row: number; nameEN: string; nameAR: string; reason: 'sheet' | 'db' }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadPreview = async () => {
      if (typeof window === 'undefined') return
      const stored = window.sessionStorage.getItem('catalogImportFile')
      if (!stored) {
        setError(t('missingImportFile'))
        return
      }

      try {
        const parsed = JSON.parse(stored) as { name?: string; type?: string; lastModified?: number; data?: string }
        if (!parsed?.name || !parsed?.data) throw new Error('Missing file selection')

        const dataUrl = parsed.data
        const base64 = dataUrl.split(',')[1]
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i)
        }

        const file = new File([bytes], parsed.name, {
          type: parsed.type || 'application/octet-stream',
          lastModified: parsed.lastModified || Date.now(),
        })

        const formData = new FormData()
        formData.append('file', file)

        setLoading(true)
        setError(null)
        setSuccessMessage(null)
        const res = await fetch('/api/admin/catalog-products/import/preview', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data?.errors?.[0]?.error || t('unableToPreviewImport'))

        setProducts(data.previewProducts || [])
        setCategories(data.categories || [])
        setDuplicates(data.duplicates || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : t('unableToPreviewImport'))
      } finally {
        setLoading(false)
      }
    }

    loadPreview()
  }, [t])

  const duplicateRowNumbers = useMemo(() => new Set(duplicates.map((d) => d.row)), [duplicates])

  const updateProduct = (index: number, field: keyof PreviewProduct, value: string | number | string[]) => {
    setProducts((prev) => prev.map((product, idx) => idx === index ? { ...product, [field]: value } as PreviewProduct : product))
  }

  const addImageToProduct = async (index: number) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data?.path) {
        setProducts((prev) => prev.map((product, idx) => idx === index ? { ...product, images: [...product.images, data.path] } : product))
      }
    }
    input.click()
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    try {
      const payload = {
        products: products.filter((product) => !duplicateRowNumbers.has(product.rowNumber ?? 0)),
      }

      const res = await fetch('/api/admin/catalog-products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.error || 'Import failed')
      setSuccessMessage(`${data.imported || 0} products added to the catalog.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="admin-catalog container" style={{ paddingBottom: 48 }}>
      <div className="admin-page-header" style={{ marginBottom: 24 }}>
        <div>
          <Link href="/admin/catalog" className="btn" style={{ marginBottom: 12, display: 'inline-flex' }}>← {t('back')}</Link>
          <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>{t('importCatalogProducts')}</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>{t('importReviewInstruction')}</p>
        </div>
        <button type="button" className="btn primary" onClick={handleSubmit} disabled={loading}>
          {loading ? t('working') : t('addToCatalog')}
        </button>
      </div>

      {error && <div className="form-error" style={{ marginBottom: 16 }}>{error}</div>}
      {successMessage && <div className="form-success" style={{ marginBottom: 16 }}>{successMessage}</div>}

      {duplicates.length > 0 && (
        <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, marginBottom: 8, color: 'var(--text-primary)' }}>{t('duplicateProductsDetected')}</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {duplicates.map((dup) => (
              <li key={`${dup.row}-${dup.reason}`}>
                {t('rowNumber', { row: dup.row })}: {dup.nameEN || dup.nameAR} ({dup.nameAR || dup.nameEN}) — {dup.reason === 'db' ? t('duplicateAlreadyExistsInCatalog') : t('duplicateAlreadyAppearsInSheet')}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {products.map((product, index) => {
          const isDuplicate = duplicateRowNumbers.has(product.rowNumber ?? 0)
          return (
            <div key={`${product.nameEN}-${index}`} style={{ border: `1px solid ${isDuplicate ? 'rgba(220,38,38,0.35)' : 'var(--border-light)'}`, borderRadius: 20, padding: 20, background: 'var(--surface-card, #fff)', boxShadow: '0 16px 40px rgba(15,23,42,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0 }}>{product.nameEN || product.nameAR || t('productNumber', { number: index + 1 })}</h3>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>{t('rowNumber', { row: product.rowNumber || index + 2 })}</p>
                </div>
                {isDuplicate && <span style={{ color: '#b91c1c', fontWeight: 600 }}>{t('duplicate')}</span>}
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('productNameEN')}</span>
                  <input dir={locale === 'ar' ? 'ltr' : undefined} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} value={product.nameEN} onChange={(e) => updateProduct(index, 'nameEN', e.target.value)} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('productNameAR')}</span>
                  <input dir="rtl" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} value={product.nameAR} onChange={(e) => updateProduct(index, 'nameAR', e.target.value)} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('categoryLabel')}</span>
                  <select style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} value={product.categoryId} onChange={(e) => updateProduct(index, 'categoryId', e.target.value)}>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>{category.nameEN || category.nameAR || category.id}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('unitLabel')}</span>
                  <select value={product.unitType} onChange={(e) => updateProduct(index, 'unitType', e.target.value)}>
                    <option value="PIECE">{t('piece')}</option>
                    <option value="BOX">{t('box')}</option>
                    <option value="PACK">{t('pack')}</option>
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('statusLabel')}</span>
                  <select value={product.status} onChange={(e) => updateProduct(index, 'status', e.target.value)}>
                    <option value="ACTIVE">{t('active')}</option>
                    <option value="DRAFT">{t('draft')}</option>
                    <option value="INACTIVE">{t('inactive')}</option>
                    <option value="ARCHIVED">{t('archived')}</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('wholesaleMin')}</span>
                  <input style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} type="number" value={product.wholesaleMinPrice} onChange={(e) => updateProduct(index, 'wholesaleMinPrice', Number(e.target.value))} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('wholesaleMax')}</span>
                  <input style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} type="number" value={product.wholesaleMaxPrice} onChange={(e) => updateProduct(index, 'wholesaleMaxPrice', Number(e.target.value))} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('retailMin')}</span>
                  <input style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} type="number" value={product.retailMinPrice} onChange={(e) => updateProduct(index, 'retailMinPrice', Number(e.target.value))} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('retailMax')}</span>
                  <input style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} type="number" value={product.retailMaxPrice} onChange={(e) => updateProduct(index, 'retailMaxPrice', Number(e.target.value))} />
                </label>
              </div>

              <div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr', marginTop: 16 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('descriptionEN')}</span>
                  <textarea dir={locale === 'ar' ? 'ltr' : undefined} style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} rows={3} value={product.descriptionEN} onChange={(e) => updateProduct(index, 'descriptionEN', e.target.value)} />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span>{t('descriptionAR')}</span>
                  <textarea dir="rtl" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }} rows={3} value={product.descriptionAR} onChange={(e) => updateProduct(index, 'descriptionAR', e.target.value)} />
                </label>
              </div>

              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{t('productImages')}</strong>
                  <button type="button" className="btn" onClick={() => addImageToProduct(index)}>+ {t('addImage')}</button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {product.images.length === 0 ? <div style={{ color: 'var(--text-secondary)' }}>{t('noImagesAddedYet')}</div> : product.images.map((image, imageIndex) => (
                    <img key={`${image}-${imageIndex}`} src={image} alt={`${product.nameEN || product.nameAR || t('product')}-${imageIndex + 1}`} style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, border: '1px solid var(--border-light)' }} />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
