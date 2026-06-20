import React from "react";
import { getProviders } from "@/lib/actions/admin.actions";
import ProviderActions from '@/components/admin/ProviderActions'
import SuspendProviderClient from '@/components/admin/SuspendProviderClient'
import ToggleVisibilityClient from '@/components/admin/ToggleVisibilityClient'
import Link from 'next/link'

export default async function ProvidersPage() {
  const providers = await getProviders();

  return (
    <section className="admin-providers container">
      <h1>Providers</h1>
      <div className="table-wrap">
        <table className="providers-table">
          <thead>
            <tr>
              <th>Store</th>
              <th>Owner</th>
              <th>Mobile</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.length === 0 && (
              <tr>
                <td colSpan={6}>No providers found.</td>
              </tr>
            )}

            {providers.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="store-name">
                    <Link href={`/admin/accounts/providers/${p.id}`}>{p.shopNameEN || p.shopNameAR}</Link>
                  </div>
                </td>
                <td>{p.user?.nameEN || p.user?.nameAR || "-"}</td>
                <td>{p.user?.mobile}</td>
                <td>{p.user?.status ?? 'PENDING'}</td>
                <td>{new Date(p.createdAt).toLocaleString()}</td>
                <td>
                  {p.user?.status === 'PENDING' ? (
                    <ProviderActions providerId={p.id} />
                  ) : p.user?.status === 'APPROVED' ? (
                    // show toggle visibility action for approved providers
                    <ToggleVisibilityClient providerId={p.id} visible={!!p.isVisible} />
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
