import React from 'react'
import { getProviders } from '@/lib/actions/admin.actions'
import ProviderActions from '@/components/admin/ProviderActions'
import AdminDeleteButton from '@/components/admin/AdminDeleteButton'
import SuspendProviderClient from '@/components/admin/SuspendProviderClient'
import ToggleVisibilityClient from '@/components/admin/ToggleVisibilityClient'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default async function ProvidersPage() {
  const providers = await getProviders()

  return (
    <section className="admin-providers container">
      <h1>Providers</h1>
      <Card>
        <Table className="providers-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 12 }}>Store</th>
              <th style={{ padding: 12 }}>Owner</th>
              <th style={{ padding: 12 }}>Mobile</th>
              <th style={{ padding: 12 }}>Status</th>
              <th style={{ padding: 12 }}>Created</th>
              <th style={{ padding: 12 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 16 }}>No providers found.</td>
              </tr>
            )}

            {providers.map((p) => (
              <tr key={p.id} style={{ borderTop: '1px solid var(--border-light)' }}>
                <td style={{ padding: 12 }}>
                  <div className="store-name">
                    <Link href={`/admin/accounts/providers/${p.id}`}>{p.shopNameEN || p.shopNameAR}</Link>
                  </div>
                </td>
                <td style={{ padding: 12 }}>{p.user?.nameEN || p.user?.nameAR || '-'}</td>
                <td style={{ padding: 12 }}>{p.user?.mobile}</td>
                <td style={{ padding: 12 }}>{p.user?.status ?? 'PENDING'}</td>
                <td style={{ padding: 12 }}>{new Date(p.createdAt).toLocaleString()}</td>
                <td style={{ padding: 12 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {p.user?.status === 'PENDING' ? (
                      <ProviderActions providerId={p.id} />
                    ) : p.user?.status === 'APPROVED' ? (
                      <ToggleVisibilityClient providerId={p.id} visible={!!p.isVisible} />
                    ) : (
                      <span className="muted">—</span>
                    )}
                    <AdminDeleteButton userId={p.user?.id} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </section>
  )
}
