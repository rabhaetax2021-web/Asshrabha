export function getDeliveryLocationDetails(address: Record<string, unknown> | null | undefined) {
  const addressLine = normalize(address?.addressLine)
  const city = normalize(address?.city)
  const area = normalize(address?.area)
  const landmark = normalize(address?.landmark)
  const directUrl = normalize(address?.locationUrl)
  const lat = parseCoordinate(address?.lat)
  const lng = parseCoordinate(address?.lng)
  const location = getRecord(address?.location)
  const locationName = normalize(location?.nameEN) || normalize(location?.nameAR) || normalize(address?.locationId)

  const displayAddress = [addressLine, city, area, landmark].filter(Boolean).join(', ')
  const mapsUrl = directUrl
    || (typeof lat === 'number' && typeof lng === 'number'
      ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      : locationName
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationName)}`
        : displayAddress
          ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`
          : '')

  return {
    displayAddress,
    mapsUrl,
    directUrl,
    hasLocation: Boolean(displayAddress || mapsUrl),
  }
}

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}

function parseCoordinate(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
