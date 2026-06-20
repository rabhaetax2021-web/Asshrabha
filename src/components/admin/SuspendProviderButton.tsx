"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'

export default function SuspendProviderButton({ providerId }: { providerId: string }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [note, setNote] = useState('')

  async function handleSuspend(noteArg?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend', suspendNote: noteArg }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Request failed')
      showToast('Provider suspended', 'success')
      window.location.reload()
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className="btn btn-danger" disabled={loading} onClick={() => setShowModal(true)}>
        Suspend
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Suspend provider</h3>
              <button className="btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              <label className="label">Optional note</label>
              <textarea className="input" value={note} onChange={e => setNote(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowModal(false); handleSuspend(note) }}>Suspend</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
