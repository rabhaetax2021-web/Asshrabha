import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import AdminEditActions from '@/components/admin/AdminEditActions'
import { buildProviderEditChangeSummary } from '@/lib/utils/customer-profile-edit-summary'

export default async function ProviderProfileEditsPage() {
  const current = await getCurrentUser()
  if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return <div>Unauthorized</div>

  const edits = await prisma.providerProfileEdit.findMany({ where: {}, orderBy: { createdAt: 'desc' }, include: { provider: true, requester: true } })

  return (
    <section className="admin container">
      <h1>Provider Profile Edit Requests</h1>
      <div style={{ display: 'grid', gap: 12 }}>
        {edits.map(e => (
          <div key={e.id} style={{ border: '1px solid #e5e7eb', padding: 12, borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{e.provider?.shopNameEN || e.provider?.shopNameAR || 'Provider'}</strong>
                <div>Requester: {e.requester?.nameEN || e.requester?.nameAR || e.requester?.mobile}</div>
                <div>Status: {e.status}</div>
                <div>Created: {new Date(e.createdAt).toLocaleString()}</div>
                {e.adminNote ? <div style={{ marginTop: 4 }}>Admin note: {e.adminNote}</div> : null}
              </div>
              <div>
                <AdminEditActions editId={e.id} type="provider" />
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {buildProviderEditChangeSummary(e.changes as Record<string, unknown> | null | undefined, e.provider as Record<string, unknown> | null | undefined, undefined).map((item) => (
                <div key={item.key} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 10, background: '#f8fafc' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{item.titleAR} / {item.titleEN}</div>
                  <div style={{ color: '#334155' }}>
                    <div><strong>من:</strong> {item.oldValueAR} / {item.oldValueEN}</div>
                    <div><strong>إلى:</strong> {item.newValueAR} / {item.newValueEN}</div>
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
