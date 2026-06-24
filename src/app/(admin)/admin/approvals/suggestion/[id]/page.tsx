import React from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import ApproveSuggestionForm from '@/components/admin/ApproveSuggestionForm'

type CategoryOption = { id: string; nameEN: string | null; nameAR: string | null }

export default async function SuggestionApprovalPage({ params }: { params: { id: string } }) {
  const current = await getCurrentUser()
  if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
    return <div>Unauthorized</div>
  }

  const suggestion = await prisma.productSuggestion.findUnique({
    where: { id: params.id },
    include: { provider: { include: { user: true } } },
  })

  if (!suggestion) return <div>Suggestion not found</div>

  const categories = await prisma.category.findMany({ orderBy: { nameEN: 'asc' }, take: 200 })
  const categoryOptions: CategoryOption[] = categories.map(c => ({ id: c.id, nameEN: c.nameEN, nameAR: c.nameAR }))

  return (
    <section className="admin-suggestion-approval container">
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <Link href="/admin/approvals" className="btn btn-outline">← Back to Approvals</Link>
      </div>
      <ApproveSuggestionForm suggestion={suggestion as any} categories={categoryOptions} />
    </section>
  )
}
