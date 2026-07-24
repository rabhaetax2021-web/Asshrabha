import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import AdminEditActions from '@/components/admin/AdminEditActions'
import { buildCustomerEditChangeSummary } from '@/lib/utils/customer-profile-edit-summary'

export default async function CustomerProfileEditsPage() {
  const current = await getCurrentUser()
  if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return <div>Unauthorized</div>

  const edits = await prisma.customerProfileEdit.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, include: { user: true, requester: true } })

  return (
    <section className="admin container" style={{ width: '100%', maxWidth: '100%', overflowX: 'hidden', paddingInline: 'clamp(12px, 2vw, 24px)' }}>
      <h1 style={{ fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)', marginBottom: 12, wordBreak: 'break-word' }}>Customer Profile Edit Requests</h1>
      <div style={{ display: 'grid', gap: 12, width: '100%', maxWidth: '100%' }}>
        {edits.map((e) => (
          <div key={e.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8, width: '100%', maxWidth: '100%', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', width: '100%' }}>
              <div style={{ minWidth: 0, flex: 1, overflowWrap: 'anywhere' }}>
                <strong>{e.user?.nameEN || e.user?.nameAR || 'Customer'}</strong>
                <div style={{ overflowWrap: 'anywhere' }}>Requester: {e.requester?.nameEN || e.requester?.nameAR || e.requester?.mobile}</div>
                <div>Status: <strong>{e.status}</strong></div>
                <div>Created: {new Date(e.createdAt).toLocaleString()}</div>
                {e.adminNote ? <div style={{ marginTop: 4, overflowWrap: 'anywhere' }}>Admin note: {e.adminNote}</div> : null}
              </div>
              <div style={{ flexShrink: 0, width: 'fit-content' }}>
                <AdminEditActions editId={e.id} type="customer" />
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8, width: '100%', maxWidth: '100%' }}>
              {buildCustomerEditChangeSummary(e.changes as Record<string, unknown> | null | undefined, e.user as Record<string, unknown> | null | undefined).map((item) => (
                <div key={item.key} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: '#f8fafc', width: '100%', maxWidth: '100%', overflowWrap: 'anywhere', boxSizing: 'border-box' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6, overflowWrap: 'anywhere' }}>{item.titleAR} / {item.titleEN}</div>
                  <div style={{ display: 'grid', gap: 4, color: '#334155' }}>
                    <div style={{ overflowWrap: 'anywhere' }}><strong>من:</strong> {item.oldValueAR} / {item.oldValueEN}</div>
                    <div style={{ overflowWrap: 'anywhere' }}><strong>إلى:</strong> {item.newValueAR} / {item.newValueEN}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
