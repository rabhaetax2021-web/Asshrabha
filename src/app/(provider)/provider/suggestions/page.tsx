import React from 'react'
import { prisma } from '@/lib/prisma'

export default async function ProviderSuggestionsPage() {
  const provider = await prisma.providerProfile.findFirst({ include: { user: true } })
  if (!provider) return <div>No provider</div>

  const suggestions = await prisma.productSuggestion.findMany({ where: { providerId: provider.id }, orderBy: { createdAt: 'desc' } })

  return (
    <section className="provider-suggestions container">
      <h1>Suggestions</h1>
      <ul>
        {suggestions.map(s => (
          <li key={s.id}>{s.nameEN || s.nameAR} - {s.status}</li>
        ))}
      </ul>
    </section>
  )
}
