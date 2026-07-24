"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

type Address = {
  id: string
  label: string
  fullName: string
  mobile: string
  addressLine: string
  city: string
  area?: string | null
  landmark?: string | null
  isDefault?: boolean
}

type LocationOption = {
  id: string
  nameEN?: string | null
  nameAR?: string | null
}

const MAX_ADDRESSES = 5

export default function ManageAddressesClient({ initialAddresses }: { initialAddresses: Address[] }) {
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('shop')
  const ta = useTranslations('auth')
  const tc = useTranslations('common')
  const [addresses, setAddresses] = useState(initialAddresses)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
  const [locationState, setLocationState] = useState<{ lat: number; lng: number; locationUrl: string } | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    label: 'Home',
    fullName: '',
    mobile: '',
    addressLine: '',
    city: '',
    area: '',
    landmark: '',
    isDefault: false,
  })

  useEffect(() => {
    let mounted = true
    fetch('/api/admin/locations')
      .then((res) => res.json())
      .then((j) => {
        if (!mounted) return
        setLocations(j?.locations || [])
      })
      .catch(() => {
        if (mounted) setLocations([])
      })

    return () => {
      mounted = false
    }
  }, [])

  async function captureLocation() {
    if (!('geolocation' in navigator)) {
      throw new Error(ta('geolocationUnavailable') || 'Geolocation is not available in this browser')
    }

    setGeoLoading(true)
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        })
      })

      const lat = position.coords.latitude
      const lng = position.coords.longitude
      const nextLocation = {
        lat,
        lng,
        locationUrl: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
      }
      setLocationState(nextLocation)
      return nextLocation
    } finally {
      setGeoLoading(false)
    }
  }

  function getLocalizedAddressLabel(value: string) {
    const normalized = value?.toLowerCase()
    if (normalized === 'home') return t('addressLabelHome')
    if (normalized === 'work') return t('addressLabelWork')
    if (normalized === 'other') return t('addressLabelOther')
    return value
  }

  async function addAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLocationId) {
      showToast(t('mustChooseGovernment'), 'error')
      return
    }

    if (addresses.length >= MAX_ADDRESSES) {
      showToast(t('maxAddressesReached', { count: MAX_ADDRESSES }), 'error')
      return
    }

    if (!locationState) {
      showToast(t('locationRequired'), 'error')
      return
    }

    setLoading(true)
    try {
      const selectedLocation = locations.find((location) => location.id === selectedLocationId)
      const location = locationState
      const payload = {
        ...form,
        city: locale === 'ar' ? (selectedLocation?.nameAR || selectedLocation?.nameEN || '') : (selectedLocation?.nameEN || selectedLocation?.nameAR || ''),
        locationId: selectedLocationId,
        lat: location.lat,
        lng: location.lng,
        locationUrl: location.locationUrl,
      }

      const res = await fetch('/api/shop/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: payload }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || t('failedToSave'))
      setForm({ label: 'Home', fullName: '', mobile: '', addressLine: '', city: '', area: '', landmark: '', isDefault: false })
      setSelectedLocationId('')
      setLocationState(null)
      setShowForm(false)
      showToast(t('addressSubmitted'), 'success')
      router.refresh()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function setDefaultAddress(id: string) {
    if (addresses.find((address) => address.id === id)?.isDefault) return

    setLoading(true)
    try {
      const res = await fetch('/api/shop/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_default', addressId: id }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || t('failedToSetDefault'))
      showToast(t('defaultAddressSubmitted'), 'success')
      router.refresh()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function removeAddress(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/profile/addresses?id=${id}`, { method: 'DELETE' })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || t('failedToRemove'))
      showToast(t('addressRemoved'), 'success')
      router.refresh()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', margin: 0 }}>{t('savedAddresses')}</h2>
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((prev) => !prev)}>
            {showForm ? tc('cancel') : t('addNewAddress')}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={addAddress} style={{ display: 'grid', gap: 'var(--space-3)' }}>
            <div className="form-row">
              <label className="label">{t('addressLabel')}</label>
              <select className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
                <option value="Home">{t('addressLabelHome')}</option>
                <option value="Work">{t('addressLabelWork')}</option>
                <option value="Other">{t('addressLabelOther')}</option>
              </select>
            </div>
            <div className="form-row">
              <label className="label">{t('fullName')}</label>
              <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">{t('phone')}</label>
              <input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">{t('addressLine')}</label>
              <input className="input" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} required />
            </div>
            <div className="form-row">
              <label className="label">{t('government')}</label>
              <select
                className="input"
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                required
              >
                <option value="">{t('selectGovernment')}</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.nameAR || location.nameEN || location.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label className="label">{t('area')}</label>
              <input className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            </div>
            <div className="form-row">
              <label className="label">{t('landmark')}</label>
              <input className="input" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
            </div>
            <div className="form-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => captureLocation().catch((err) => showToast(getErrorMessage(err), 'error'))}
                disabled={loading || geoLoading}
              >
                {geoLoading ? ta('gettingLocation') : ta('useMyLocation')}
              </button>
              {locationState ? (
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  {t('locationCaptured')}: {locationState.lat.toFixed(6)}, {locationState.lng.toFixed(6)}
                </div>
              ) : null}
            </div>
            <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              <label style={{ margin: 0 }}>{t('setDefaultAddress')}</label>
            </div>
            {addresses.length >= MAX_ADDRESSES ? (
              <div style={{ color: 'var(--text-error)', fontSize: 'var(--text-sm)' }}>
                {t('maxAddressesReached', { count: MAX_ADDRESSES })}
              </div>
            ) : null}
            <button type="submit" className="btn btn-primary" disabled={loading || geoLoading || !selectedLocationId || !locationState || addresses.length >= MAX_ADDRESSES}>
              {loading ? t('saving') : tc('save')}
            </button>
          </form>
        ) : null}

        {addresses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>{t('noAddresses')}</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
            {addresses.map((address) => (
              <div key={address.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)' }}>{getLocalizedAddressLabel(address.label)}</div>
                  {address.isDefault ? <span className="badge badge-success">{t('default')}</span> : null}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', display: 'grid', gap: 'var(--space-1)' }}>
                  <div>{address.fullName} · {address.mobile}</div>
                  <div>{address.addressLine}</div>
                  <div>{address.city}{address.area ? `, ${address.area}` : ''}</div>
                  {address.landmark ? <div>{t('landmark')}: {address.landmark}</div> : null}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeAddress(address.id)}
                    disabled={loading}
                  >
                    {tc('remove')}
                  </button>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setDefaultAddress(address.id)}
                      disabled={loading}
                    >
                      {t('markAsDefault')}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
