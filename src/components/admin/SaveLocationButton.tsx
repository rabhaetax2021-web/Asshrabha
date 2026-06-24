"use client"

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'

type Props = {
  providerId: string
  initialLat?: number | null
  initialLng?: number | null
}

export default function SaveLocationButton({ providerId, initialLat, initialLng }: Props) {
  const t = useTranslations('auth')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat != null && initialLng != null ? { lat: initialLat, lng: initialLng } : null
  )
  const [saved, setSaved] = useState(false)

  const saveToServer = async (lat: number, lng: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/providers/${providerId}/location`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lat, lng }),
      })
      const j = await res.json()
      if (!res.ok || !j?.ok) throw new Error(j?.error || 'Save failed')
      setCoords({ lat, lng })
      setSaved(true)
    } catch (e: any) {
      setError(String(e?.message || e))
    } finally {
      setLoading(false)
    }
  }

  const handleClick = () => {
    setError(null)
    if (!('geolocation' in navigator)) {
      setError(t('geolocationUnavailable') || 'Geolocation not available in this browser')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        saveToServer(lat, lng)
      },
      (err) => {
        setError(err?.message || (t('permissionDenied') || 'Permission denied or unavailable'))
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 15000 }
    )
  }

  const mapsUrl = coords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : null

  return (
    <div style={{ marginTop: 8 }}>
      <button type="button" className="btn-primary" onClick={handleClick} disabled={loading}>
        {loading ? (t('gettingLocation') || 'Getting location…') : saved ? (t('updateLocation') || 'Update location') : (t('grabLocation') || 'Grab location')}
      </button>

      {error && <div style={{ color: 'var(--error)', marginTop: 8 }}>{error}</div>}

      {mapsUrl && (
        <div style={{ marginTop: 8 }}>
          <a href={mapsUrl} target="_blank" rel="noreferrer">{t('openInGoogleMaps') || 'Open in Google Maps'}</a>
        </div>
      )}
    </div>
  )
}
 
