import React from 'react'
import { getPendingProviders, getPendingProviderProducts, getPendingSuggestions } from '@/lib/actions/admin.actions'
import ProviderProductActions from '@/components/admin/ProviderProductActions'
import SuggestionActions from '@/components/admin/SuggestionActions'
import ProviderActions from '@/components/admin/ProviderActions'
import Link from 'next/link'

export default async function ApprovalsPage() {
  const [providers, products, suggestions] = await Promise.all([
    getPendingProviders(),
    getPendingProviderProducts(),
    getPendingSuggestions(),
  ])

  return (
    <section className="admin-approvals container">
      <h1>Approvals</h1>

      <h2>Account Approvals</h2>
      <div className="ui-table-wrap">
        <table className="ui-table">
        <thead>
          <tr><th>Store</th><th className="hide-sm">Owner</th><th>Mobile</th><th className="hide-sm">Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {providers.map(p => (
            <tr key={p.id}>
              <td><Link href={`/admin/accounts/providers/${p.id}`}>{p.shopNameEN || p.shopNameAR}</Link></td>
              <td>{p.user?.nameEN || p.user?.nameAR}</td>
              <td>{p.user?.mobile}</td>
              <td>{new Date(p.createdAt).toLocaleString()}</td>
              <td><ProviderActions providerId={p.id} /></td>
            </tr>
          ))}
          {providers.length === 0 && <tr><td colSpan={5}>No pending accounts.</td></tr>}
        </tbody>
        </table>
      </div>

      <h2>Product Listings</h2>
      <div className="ui-table-wrap">
        <table className="ui-table">
        <thead>
          <tr><th>Product</th><th className="hide-sm">Provider</th><th>Price</th><th className="hide-sm">Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {products.map(pp => (
            <tr key={pp.id}>
              <td>{pp.catalogProduct?.nameEN || pp.catalogProduct?.nameAR}</td>
              <td>{pp.provider?.shopNameEN || pp.provider?.shopNameAR}</td>
              <td>{pp.sellingPrice}</td>
              <td>{new Date(pp.createdAt).toLocaleString()}</td>
              <td><ProviderProductActions productId={pp.id} /></td>
            </tr>
          ))}
          {products.length === 0 && <tr><td colSpan={5}>No pending product listings.</td></tr>}
        </tbody>
        </table>
      </div>

      <h2>Product Suggestions</h2>
      <div className="ui-table-wrap">
        <table className="ui-table">
        <thead>
          <tr><th>Suggestion</th><th className="hide-sm">Provider</th><th className="hide-sm">Created</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {suggestions.map(s => (
            <tr key={s.id}>
              <td>{s.nameEN || s.nameAR}</td>
              <td>{s.provider?.shopNameEN || s.provider?.shopNameAR}</td>
              <td>{new Date(s.createdAt).toLocaleString()}</td>
              <td><Link href={`/admin/approvals/suggestion/${s.id}`} className="btn btn-secondary">Review</Link></td>
            </tr>
          ))}
          {suggestions.length === 0 && <tr><td colSpan={4}>No suggestions.</td></tr>}
        </tbody>
        </table>
      </div>
    </section>
  )
}
