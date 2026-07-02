import React from 'react'
import Link from 'next/link'
import { getPendingSuggestions } from '@/lib/actions/admin.actions'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default async function SuggestionListPage() {
  const suggestions = await getPendingSuggestions()

  return (
    <section className="admin-suggestions container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Product Suggestions</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>Review and approve product suggestions submitted by providers.</p>
        </div>
        <Link href="/admin/approvals" className="btn btn-outline">← Back to Approvals</Link>
      </div>

      <Card>
        <Table>
          <thead>
            <tr>
              <th>Product Name (EN)</th>
              <th>Product Name (AR)</th>
              <th className="hide-sm">Provider</th>
              <th className="hide-sm">Category Suggestion</th>
              <th className="hide-sm">Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s: any) => (
              <tr key={s.id}>
                <td>{s.nameEN}</td>
                <td>{s.nameAR}</td>
                <td className="hide-sm">{s.provider?.shopNameEN || s.provider?.shopNameAR || '—'}</td>
                <td className="hide-sm">{s.categorySuggestion || '—'}</td>
                <td className="hide-sm">{new Date(s.createdAt).toLocaleDateString()}</td>
                <td>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-semibold)',
                    background: s.status === 'PENDING' ? 'var(--warning-bg, #fef3cd)' : s.status === 'APPROVED' ? 'var(--success-bg, #d4edda)' : 'var(--danger-bg, #f8d7da)',
                    color: s.status === 'PENDING' ? 'var(--warning-text, #856404)' : s.status === 'APPROVED' ? 'var(--success-text, #155724)' : 'var(--danger-text, #721c24)',
                  }}>
                    {s.status}
                  </span>
                </td>
                <td>
                  <Link href={`/admin/approvals/suggestion/${s.id}`} className="btn btn-secondary">Review</Link>
                </td>
              </tr>
            ))}
            {suggestions.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--text-muted)' }}>
                  No pending product suggestions.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card>
    </section>
  )
}
