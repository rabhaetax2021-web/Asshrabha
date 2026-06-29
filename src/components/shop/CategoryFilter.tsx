"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation'

export default function CategoryFilter({ allCategories, providers, currentSlug, productCount }: any) {
  const router = useRouter()
  const [category, setCategory] = useState(currentSlug || (allCategories && allCategories[0]?.slug) || '')
  const [store, setStore] = useState('')

  function doSearch(e?: React.FormEvent) {
    e?.preventDefault()
    if (!category) return
    const url = store ? `/shop/category/${encodeURIComponent(category)}?store=${encodeURIComponent(store)}` : `/shop/category/${encodeURIComponent(category)}`
    router.push(url)
  }

  return (
    <form className="filter-bar" onSubmit={doSearch} style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
      <label>
        Category:
        <select className="select input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {allCategories?.map((c: any) => (
            <option key={c.id} value={c.slug}>{c.nameEN || c.nameAR}</option>
          ))}
        </select>
      </label>

      <label>
        Store:
        <select className="select input" value={store} onChange={(e) => setStore(e.target.value)}>
          <option value="">All Stores</option>
          {providers?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.shopNameEN || p.shopNameAR}</option>
          ))}
        </select>
      </label>

      <button type="submit" className="btn btn-outline" style={{ marginLeft: 'auto' }}>
        Search
      </button>

      <span className="muted" style={{ marginLeft: 'var(--space-4)' }}>
        {productCount} product{productCount !== 1 ? 's' : ''}
      </span>
    </form>
  )
}
