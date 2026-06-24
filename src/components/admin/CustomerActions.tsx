"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'
import AdminDeleteButton from '@/components/admin/AdminDeleteButton'

export default function CustomerActions({ userId, status }: { userId: string; status?: string }) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalNote, setModalNote] = useState<string | undefined>(undefined)
  const [modalAction, setModalAction] = useState<'reject' | 'suspend' | null>(null)

  async function postAction(action: 'approve' | 'reject' | 'suspend', note?: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/customers/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
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

  return (
    <div className="customer-actions">
      {status === 'APPROVED' ? (
        <>
          <button type="button" disabled={loading} onClick={() => { setModalAction('suspend'); setModalNote(''); setShowModal(true) }} className="btn btn-warning">Suspend</button>
        </>
      ) : (
        <>
          <button type="button" disabled={loading} onClick={() => postAction('approve')} className="btn btn-primary">Approve</button>
          <button type="button" disabled={loading} onClick={() => { setModalAction('reject'); setModalNote(''); setShowModal(true) }} className="btn btn-danger">Reject</button>
          <button type="button" disabled={loading} onClick={() => { setModalAction('suspend'); setModalNote(''); setShowModal(true) }} className="btn btn-warning">Suspend</button>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalAction === 'suspend' ? 'Suspend customer' : 'Reject customer'}</h3>
              <button className="btn" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <div className="modal-body">
              <label className="label">Optional note</label>
              <textarea className="input" value={modalNote} onChange={e => setModalNote(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => {
                setShowModal(false)
                if (modalAction) postAction(modalAction, modalNote)
              }}>{modalAction === 'suspend' ? 'Suspend' : 'Reject'}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <AdminDeleteButton userId={userId} label="Delete" />
      </div>
    </div>
  )
}
