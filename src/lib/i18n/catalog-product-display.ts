export interface CatalogProductDisplaySource {
  nameEN?: string | null
  nameAR?: string | null
  descriptionEN?: string | null
  descriptionAR?: string | null
}

export function normalizeLocale(locale: string | undefined | null) {
  return String(locale || '').trim().toLowerCase().split('-')[0]
}

export function isArabicLocale(locale: string | undefined | null) {
  return normalizeLocale(locale) === 'ar'
}

export function getCatalogProductTitle(source: CatalogProductDisplaySource, locale: string | undefined | null) {
  const arabic = isArabicLocale(locale)
  return arabic ? (source.nameAR || source.nameEN || '') : (source.nameEN || source.nameAR || '')
}

export function getCatalogProductAlternateName(source: CatalogProductDisplaySource, locale: string | undefined | null) {
  const arabic = isArabicLocale(locale)
  if (source.nameEN && source.nameAR && source.nameEN !== source.nameAR) {
    return arabic ? source.nameEN : source.nameAR
  }
  return ''
}

export function getCatalogProductDescription(source: CatalogProductDisplaySource, locale: string | undefined | null) {
  const arabic = isArabicLocale(locale)
  return arabic
    ? (source.descriptionAR || source.descriptionEN || '')
    : (source.descriptionEN || source.descriptionAR || '')
}
