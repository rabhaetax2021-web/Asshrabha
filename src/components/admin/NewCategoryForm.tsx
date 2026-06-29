"use client"

import { FormEvent, useState } from 'react'
import { useTranslations } from 'next-intl'
import { getErrorMessage } from '@/lib/errors'

export default function NewCategoryForm({ onCreated }: { onCreated?: () => void }) {
  const t = useTranslations('admin')
  const tc = useTranslations('common')
  const [nameEN, setNameEN] = useState('')
  const [nameAR, setNameAR] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameEN, nameAR, slug })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      if (onCreated) onCreated()
      window.location.href = '/admin/categories'
    } catch (err: unknown) {
      setError(getErrorMessage(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <label>{t('categoryNameEN')}</label>
        <input value={nameEN} onChange={e => setNameEN(e.target.value)} />
      </div>
      <div className="form-row">
        <label>{t('categoryNameAR')}</label>
        <input value={nameAR} onChange={e => setNameAR(e.target.value)} />
      </div>
      <div className="form-row">
        <label>{t('categoryImage')}</label>
        <input value={slug} onChange={e => setSlug(e.target.value)} />
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button type="submit" className="btn primary" disabled={loading}>{loading ? tc('loading') : t('createCategory')}</button>
      </div>
    </form>
  )
}
