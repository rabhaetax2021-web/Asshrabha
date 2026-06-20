"use client"

import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'

export default function ProviderActions({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalNote, setModalNote] = useState('')
  const [modalAction, setModalAction] = useState<'reject' | null>(null)

  async function postAction(action: 'approve' | 'reject', note?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Request failed')
      showToast('Success', 'success')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="provider-actions">
      <button type="button" disabled={loading} onClick={() => postAction('approve')} className="btn btn-primary">Approve</button>
      <button type="button" disabled={loading} onClick={() => { setModalAction('reject'); setModalNote(''); setShowModal(true) }} className="btn btn-danger">Reject</button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Reject provider</h3>
              <button className="btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              <label className="label">Optional note</label>
              <textarea className="input" value={modalNote} onChange={e => setModalNote(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowModal(false); if (modalAction) postAction(modalAction, modalNote) }}>Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
