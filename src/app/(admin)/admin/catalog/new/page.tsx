import React from 'react'
import Link from 'next/link'

export default function NewCatalogPage() {
  return (
    <section className="admin-catalog container">
      <h1>Create Catalog</h1>
      <p>Placeholder page for creating a new catalog. Implement form here.</p>
      <p><Link href="/admin/catalog">← Back to Catalog</Link></p>
    </section>
  )
}
