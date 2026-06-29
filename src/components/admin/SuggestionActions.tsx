"use client"

import { useState } from 'react';
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function SuggestionActions({ suggestionId }: { suggestionId: string }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null)
  const [modalNote, setModalNote] = useState('')
  const [wholesaleMinPrice, setWholesaleMinPrice] = useState('')
  const [wholesaleMaxPrice, setWholesaleMaxPrice] = useState('')
  const [retailMinPrice, setRetailMinPrice] = useState('')
  const [retailMaxPrice, setRetailMaxPrice] = useState('')

  async function postAction(payload: Record<string, unknown>) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/suggestions/${suggestionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      showToast('Success', 'success')
      window.location.reload()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  function openApproveModal() {
    setModalAction('approve')
    setModalNote('')
    setWholesaleMinPrice('')
    setWholesaleMaxPrice('')
    setRetailMinPrice('')
    setRetailMaxPrice('')
    setShowModal(true)
  }

  function openRejectModal() {
    setModalAction('reject')
    setModalNote('')
    setShowModal(true)
  }

  function handleSubmit() {
    if (modalAction === 'approve') {
      if (!wholesaleMinPrice || !wholesaleMaxPrice || !retailMinPrice || !retailMaxPrice) {
        showToast('Please enter all price range fields.', 'error')
        return
      }
      const payload = {
        action: 'approve',
        note: modalNote || undefined,
        wholesaleMinPrice: Number(wholesaleMinPrice),
        wholesaleMaxPrice: Number(wholesaleMaxPrice),
        retailMinPrice: Number(retailMinPrice),
        retailMaxPrice: Number(retailMaxPrice),
      }
      setShowModal(false)
      postAction(payload)
      return
    }

    if (modalAction === 'reject') {
      setShowModal(false)
      postAction({ action: 'reject', note: modalNote || undefined })
    }
  }

  return (
    <div className="suggestion-actions">
      <button type="button" disabled={loading} onClick={openApproveModal} className="btn btn-primary">Approve</button>
      <button type="button" disabled={loading} onClick={openRejectModal} className="btn btn-danger">Reject</button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalAction === 'approve' ? 'Approve suggestion' : 'Reject suggestion'}</h3>
              <button className="btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              {modalAction === 'approve' ? (
                <>
                  <label className="label">Wholesale Min Price</label>
                  <input className="input" type="number" min="0" value={wholesaleMinPrice} onChange={e => setWholesaleMinPrice(e.target.value)} />
                  <label className="label">Wholesale Max Price</label>
                  <input className="input" type="number" min="0" value={wholesaleMaxPrice} onChange={e => setWholesaleMaxPrice(e.target.value)} />
                  <label className="label">Retail Min Price</label>
                  <input className="input" type="number" min="0" value={retailMinPrice} onChange={e => setRetailMinPrice(e.target.value)} />
                  <label className="label">Retail Max Price</label>
                  <input className="input" type="number" min="0" value={retailMaxPrice} onChange={e => setRetailMaxPrice(e.target.value)} />
                  <label className="label">Optional note</label>
                  <textarea className="input" value={modalNote} onChange={e => setModalNote(e.target.value)} />
                </>
              ) : (
                <>
                  <label className="label">Optional note</label>
                  <textarea className="input" value={modalNote} onChange={e => setModalNote(e.target.value)} />
                </>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                {modalAction === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
