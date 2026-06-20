import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import AdminEditActions from '@/components/admin/AdminEditActions'

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
              </div>
              <div>
                <AdminEditActions editId={e.id} type="provider" />
              </div>
            </div>
            <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{JSON.stringify(e.changes, null, 2)}</pre>
          </div>
        ))}
      </div>
    </section>
  )
}
