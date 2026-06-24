"use client"

import React, { useEffect, useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

interface Location {
  id: string
  nameEN?: string
  nameAR?: string
}

interface DeliveryZone {
  id: string
  shippingPrice: number
  isActive: boolean
  location: Location
}

export default function ProviderDeliveryAreasClient() {
  const [zones, setZones] = useState<DeliveryZone[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [locationId, setLocationId] = useState('')
  const [shippingPrice, setShippingPrice] = useState('0')
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [zonesRes, locationsRes] = await Promise.all([
          fetch('/api/provider/delivery-zones'),
          fetch('/api/admin/locations'),
        ])

        const zonesJson = await zonesRes.json()
        const locationsJson = await locationsRes.json()

        if (mounted) {
          setZones(zonesJson?.ok ? zonesJson.zones : [])
          setLocations(locationsJson?.ok ? locationsJson.locations : [])
        }
      } catch (err: unknown) {
        if (mounted) {
          showToast(getErrorMessage(err), 'error')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const refreshZones = async () => {
    try {
      const res = await fetch('/api/provider/delivery-zones')
      const json = await res.json()
      if (res.ok && json.ok) {
        setZones(json.zones)
      }
      return json
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
      return null
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!locationId) {
      showToast('Please choose a governorate', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/provider/delivery-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, shippingPrice: Number(shippingPrice) || 0, isActive }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || 'Failed to save delivery area')
      }
      showToast('Delivery area added', 'success')
      setLocationId('')
      setShippingPrice('0')
      setIsActive(true)
      await refreshZones()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Remove this delivery area?')) return
    try {
      const res = await fetch(`/api/provider/delivery-zones/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        throw new Error(json?.error || 'Failed to remove delivery area')
      }
      showToast('Delivery area removed', 'success')
      await refreshZones()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <h2 style={{ marginTop: 0 }}>Add Delivery Area</h2>
        <form onSubmit={handleSubmit} className="admin-form" style={{ display: 'grid', gap: 'var(--space-4)' }}>
          <div className="form-row">
            <label className="label">Governorate</label>
            <select className="input" value={locationId} onChange={(e) => setLocationId(e.target.value)}>
              <option value="">Select governorate</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.nameEN || location.nameAR || location.id}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label className="label">Shipping Price</label>
            <input
              className="input"
              type="number"
              min="0"
              step="0.01"
              value={shippingPrice}
              onChange={(e) => setShippingPrice(e.target.value)}
            />
          </div>

          <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input id="delivery-area-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label htmlFor="delivery-area-active">Active delivery area</label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Add Area'}
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
          <h2 style={{ margin: 0 }}>Active Delivery Areas</h2>
          {loading && <span style={{ color: 'var(--text-muted)' }}>Loading...</span>}
        </div>

        {zones.length === 0 ? (
          <div style={{ color: 'var(--text-muted)' }}>No delivery areas added yet.</div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {zones.map((zone) => (
              <div key={zone.id} className="card" style={{ padding: 'var(--space-4)', display: 'grid', gap: 'var(--space-2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>{zone.location?.nameEN || zone.location?.nameAR || 'Unknown location'}</strong>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleDelete(zone.id)}>
                    Remove
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>Price: {zone.shippingPrice.toFixed(2)} EGP</span>
                  <span>Status: {zone.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
