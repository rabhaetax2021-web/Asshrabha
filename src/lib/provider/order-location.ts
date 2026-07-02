export function getDeliveryLocationDetails(address: Record<string, unknown> | null | undefined) {
  const addressLine = normalize(address?.addressLine)
  const city = normalize(address?.city)
  const area = normalize(address?.area)
  const landmark = normalize(address?.landmark)
  const directUrl = normalize(address?.locationUrl)
  const lat = typeof address?.lat === 'number' ? address.lat : undefined
  const lng = typeof address?.lng === 'number' ? address.lng : undefined

  const displayAddress = [addressLine, city, area, landmark].filter(Boolean).join(', ')
  const mapsUrl = directUrl || (typeof lat === 'number' && typeof lng === 'number' ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : displayAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}` : '')

  return {
    displayAddress,
    mapsUrl,
    directUrl,
    hasLocation: Boolean(displayAddress || mapsUrl),
  }
}

function normalize(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}
