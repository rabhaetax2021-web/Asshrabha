import React from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import NewSuggestionForm from '@/components/provider/NewSuggestionForm'

export default async function ProviderSuggestionsPage() {
  const current = await getCurrentUser()
  if (!current || current.role !== 'PROVIDER' || current.status !== 'APPROVED') return <div>Unauthorized</div>

  const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id } })
  if (!provider) return <div>No provider profile found</div>

  const suggestions = await prisma.productSuggestion.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: 'desc' } })

  return (
    <section className="provider-suggestions container">
      <h1>Suggest New Catalog Product</h1>
      <NewSuggestionForm />
      <div style={{ marginTop: 'var(--space-6)' }}>
        <h2>Your Suggestions</h2>
        <ul>
          {suggestions.map(s => (
            <li key={s.id} style={{ marginBottom: 'var(--space-3)' }}>
              <strong>{s.nameEN || s.nameAR}</strong> — {s.status}
            </li>
          ))}
          {suggestions.length === 0 && <li>No suggestions submitted yet.</li>}
        </ul>
      </div>
    </section>
  )
}
