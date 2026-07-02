"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

type CategoryItem = {
  id: string
  nameEN: string
  nameAR: string
  slug: string
  createdAt: string
  updatedAt: string
  _count?: { products: number }
}

type Notice = { kind: 'success' | 'error'; text: string } | null

export default function CategoryManager({ initialCategories }: { initialCategories: CategoryItem[] }) {
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState({ nameEN: '', nameAR: '', slug: '' })
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [notice, setNotice] = useState<Notice>(null)

  const startEdit = (category: CategoryItem) => {
    setEditingId(category.id)
    setDraft({ nameEN: category.nameEN || '', nameAR: category.nameAR || '', slug: category.slug || '' })
    setNotice(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft({ nameEN: '', nameAR: '', slug: '' })
  }

  const saveCategory = async (id: string) => {
    setLoadingId(id)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...draft }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')

      setCategories((current) => current.map((category) => category.id === id ? { ...category, ...data.category, _count: category._count } : category))
      setEditingId(null)
      setDraft({ nameEN: '', nameAR: '', slug: '' })
      setNotice({ kind: 'success', text: 'Category updated successfully.' })
      router.refresh()
      showToast('Category updated', 'success')
    } catch (err: unknown) {
      setNotice({ kind: 'error', text: getErrorMessage(err) })
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoadingId(null)
    }
  }

  const deleteCategory = async (category: CategoryItem) => {
    const productCount = category._count?.products ?? 0
    const hasProducts = productCount > 0
    const confirmed = hasProducts
      ? window.confirm(`This category still has ${productCount} product(s). Delete it anyway?`)
      : window.confirm('Delete this category?')

    if (!confirmed) return

    setLoadingId(category.id)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id, force: hasProducts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')

      setCategories((current) => current.filter((item) => item.id !== category.id))
      setNotice({ kind: 'success', text: 'Category deleted successfully.' })
      router.refresh()
      showToast('Category deleted', 'success')
    } catch (err: unknown) {
      setNotice({ kind: 'error', text: getErrorMessage(err) })
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      {notice && (
        <div className={`form-message ${notice.kind === 'error' ? 'form-error' : 'form-success'}`}>
          {notice.text}
        </div>
      )}

      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>Name</th>
              <th className="hide-sm">Slug</th>
              <th className="hide-sm">Products</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={4}>No categories found.</td>
              </tr>
            )}

            {categories.map((category) => {
              const isEditing = editingId === category.id
              const productCount = category._count?.products ?? 0

              return (
                <tr key={category.id}>
                  {isEditing ? (
                    <>
                      <td>
                        <div className="form-row">
                          <label>Name (EN)</label>
                          <input value={draft.nameEN} onChange={(event) => setDraft((current) => ({ ...current, nameEN: event.target.value }))} />
                        </div>
                        <div className="form-row">
                          <label>Name (AR)</label>
                          <input value={draft.nameAR} onChange={(event) => setDraft((current) => ({ ...current, nameAR: event.target.value }))} />
                        </div>
                      </td>
                      <td>
                        <div className="form-row">
                          <label>Slug</label>
                          <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} />
                        </div>
                      </td>
                      <td>{productCount}</td>
                      <td>
                        <div className="admin-catalog-actions" style={{ gap: 8 }}>
                          <button className="btn primary" disabled={loadingId === category.id} onClick={() => saveCategory(category.id)}>
                            {loadingId === category.id ? 'Saving...' : 'Save'}
                          </button>
                          <button className="btn btn-secondary" onClick={cancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        <strong>{category.nameEN || category.nameAR || '-'}</strong>
                        {category.nameAR && category.nameEN ? <div>{category.nameAR}</div> : null}
                      </td>
                      <td>{category.slug}</td>
                      <td>{productCount}</td>
                      <td>
                        <div className="admin-catalog-actions" style={{ gap: 8 }}>
                          <button className="btn btn-secondary" onClick={() => startEdit(category)}>
                            Edit
                          </button>
                          <button className="btn btn-danger" disabled={loadingId === category.id} onClick={() => deleteCategory(category)}>
                            {loadingId === category.id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
