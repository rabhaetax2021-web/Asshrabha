export function buildCategorySlug(nameEN: string | null | undefined, nameAR: string | null | undefined, slug?: string | null) {
  const raw = (slug && String(slug).trim()) || (nameEN && String(nameEN).trim()) || (nameAR && String(nameAR).trim()) || ''
  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\u0600-\u06ff]+/gu, '-')
    .replace(/(^-|-$)/g, '')

  return normalized || 'category'
}

export function getCategoryDeletionOutcome({ productCount, force }: { productCount: number; force?: boolean }) {
  if (productCount > 0 && !force) {
    return { ok: false, reason: 'category_has_products' as const }
  }

  return { ok: true }
}
