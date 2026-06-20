import React from 'react'
import Link from 'next/link'
import NewCategoryForm from '@/components/admin/NewCategoryForm'
import IntlText from '@/components/IntlText'

export default function NewCategoryPage() {
  return (
    <section className="admin-categories container">
      <h1><IntlText ns="admin" id="createCategory" /></h1>
      <NewCategoryForm />
      <p><Link href="/admin/categories">← <IntlText ns="common" id="back" /></Link></p>
    </section>
  )
}
