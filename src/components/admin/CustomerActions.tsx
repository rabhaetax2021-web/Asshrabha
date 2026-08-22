"use client"
import { useState } from 'react';
import { useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'
import AdminDeleteButton from '@/components/admin/AdminDeleteButton'

export default function CustomerActions({ userId, status }: { userId: string; status?: string }) {
  const t = useTranslations('admin')
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
      showToast(t('success'), 'success')
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
          <button type="button" disabled={loading} onClick={() => { setModalAction('suspend'); setModalNote(''); setShowModal(true) }} className="btn btn-warning">{t('suspend')}</button>
        </>
      ) : (
        <>
          <button type="button" disabled={loading} onClick={() => postAction('approve')} className="btn btn-primary">{t('approve')}</button>
          <button type="button" disabled={loading} onClick={() => { setModalAction('reject'); setModalNote(''); setShowModal(true) }} className="btn btn-danger">{t('reject')}</button>
          <button type="button" disabled={loading} onClick={() => { setModalAction('suspend'); setModalNote(''); setShowModal(true) }} className="btn btn-warning">{t('suspend')}</button>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{modalAction === 'suspend' ? t('suspendCustomer') : t('rejectCustomer')}</h3>
              <button className="btn" onClick={() => setShowModal(false)}>{t('close')}</button>
            </div>
            <div className="modal-body">
              <label className="label">{t('optionalNote')}</label>
              <textarea className="input" value={modalNote} onChange={e => setModalNote(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn" onClick={() => setShowModal(false)}>{t('cancel')}</button>
              <button className="btn btn-primary" onClick={() => {
                setShowModal(false)
                if (modalAction) postAction(modalAction, modalNote)
              }}>{modalAction === 'suspend' ? t('suspend') : t('reject')}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <AdminDeleteButton userId={userId} label={t('delete')} />
      </div>
    </div>
  )
}
