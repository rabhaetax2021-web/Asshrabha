import React from 'react'
import Link from 'next/link'
import NewCategoryForm from '@/components/admin/NewCategoryForm'
import IntlText from '@/components/IntlText'
import { getCurrentUser } from '@/lib/auth'

export default async function NewCategoryPage() {
  const current = await getCurrentUser()
  if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
    return <div className="container">Unauthorized</div>
  }

  return (
    <section className="admin-categories container">
      <h1><IntlText ns="admin" id="createCategory" /></h1>
      <NewCategoryForm />
      <p><Link href="/admin/categories">← <IntlText ns="common" id="back" /></Link></p>
    </section>
  )
}
