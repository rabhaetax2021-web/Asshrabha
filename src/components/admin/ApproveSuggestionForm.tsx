"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

type CategoryOption = { id: string; nameEN: string | null; nameAR: string | null }

type Suggestion = {
  id: string
  nameEN: string
  nameAR: string
  descriptionEN?: string | null
  descriptionAR?: string | null
  images: string[]
  categorySuggestion?: string | null
  provider?: {
    shopNameEN?: string | null
    shopNameAR?: string | null
    user?: { nameEN?: string | null; nameAR?: string | null; mobile?: string | null }
  }
}

export default function ApproveSuggestionForm({ suggestion, categories }: { suggestion: Suggestion; categories: CategoryOption[] }) {
  const router = useRouter()
  const [wholesaleMinPrice, setWholesaleMinPrice] = useState('')
  const [wholesaleMaxPrice, setWholesaleMaxPrice] = useState('')
  const [retailMinPrice, setRetailMinPrice] = useState('')
  const [retailMaxPrice, setRetailMaxPrice] = useState('')
  const [categoryId, setCategoryId] = useState(() => {
    const suggested = suggestion.categorySuggestion?.trim()
    if (suggested) {
      const match = categories.find(cat =>
        cat.id === suggested ||
        cat.nameEN?.toLowerCase() === suggested.toLowerCase() ||
        cat.nameAR?.toLowerCase() === suggested.toLowerCase()
      )
      if (match) return match.id
    }
    return categories[0]?.id || ''
  })
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function approveSuggestion() {
    if (!categoryId) {
      showToast('Please select a category.', 'error')
      return
    }
    if (!wholesaleMinPrice || !wholesaleMaxPrice || !retailMinPrice || !retailMaxPrice) {
      showToast('Please fill in all price range fields.', 'error')
      return
    }
    const wholesaleMin = Number(wholesaleMinPrice)
    const wholesaleMax = Number(wholesaleMaxPrice)
    const retailMin = Number(retailMinPrice)
    const retailMax = Number(retailMaxPrice)
    if (wholesaleMin > wholesaleMax) {
      showToast('Wholesale min cannot be greater than wholesale max.', 'error')
      return
    }
    if (retailMin > retailMax) {
      showToast('Retail min cannot be greater than retail max.', 'error')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suggestions/${suggestion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          note: note || undefined,
          categoryId,
          wholesaleMinPrice: wholesaleMin,
          wholesaleMaxPrice: wholesaleMax,
          retailMinPrice: retailMin,
          retailMaxPrice: retailMax,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Approval failed')
      showToast('Suggestion approved and added to catalog.', 'success')
      router.push('/admin/approvals')
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function rejectSuggestion() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suggestions/${suggestion.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', note: note || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Reject failed')
      showToast('Suggestion rejected.', 'success')
      router.push('/admin/approvals')
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-suggestion-review">
      <section className="suggestion-summary" style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Suggestion Details</h2>
        <p><strong>Name EN:</strong> {suggestion.nameEN}</p>
        <p><strong>Name AR:</strong> {suggestion.nameAR}</p>
        {suggestion.categorySuggestion && <p><strong>Suggested category:</strong> {suggestion.categorySuggestion}</p>}
        <p><strong>Provider:</strong> {suggestion.provider?.shopNameEN || suggestion.provider?.shopNameAR || suggestion.provider?.user?.nameEN || suggestion.provider?.user?.nameAR || suggestion.provider?.user?.mobile || 'Unknown'}</p>
        {suggestion.descriptionEN && <p><strong>Description EN:</strong> {suggestion.descriptionEN}</p>}
        {suggestion.descriptionAR && <p><strong>Description AR:</strong> {suggestion.descriptionAR}</p>}
        {suggestion.images.length > 0 && (
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', marginTop: 'var(--space-3)' }}>
            {suggestion.images.map((img, index) => (
              <img key={index} src={img} alt={`${suggestion.nameEN} image ${index + 1}`} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        )}
      </section>

      <section className="suggestion-approval-form">
        <h2>Approve Suggestion</h2>
        <div className="form-grid" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <label className="label">Category</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nameEN || cat.nameAR || cat.id}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label className="label">Wholesale Min Price</label>
              <input className="input" type="number" min="0" value={wholesaleMinPrice} onChange={(e) => setWholesaleMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Wholesale Max Price</label>
              <input className="input" type="number" min="0" value={wholesaleMaxPrice} onChange={(e) => setWholesaleMaxPrice(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div>
              <label className="label">Retail Min Price</label>
              <input className="input" type="number" min="0" value={retailMinPrice} onChange={(e) => setRetailMinPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Retail Max Price</label>
              <input className="input" type="number" min="0" value={retailMaxPrice} onChange={(e) => setRetailMaxPrice(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Admin Note</label>
            <textarea className="input" value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" className="btn btn-primary" onClick={approveSuggestion} disabled={loading}>
              {loading ? 'Saving...' : 'Approve and Add to Catalog'}
            </button>
            <button type="button" className="btn btn-danger" onClick={rejectSuggestion} disabled={loading}>
              {loading ? 'Rejecting...' : 'Reject Suggestion'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
