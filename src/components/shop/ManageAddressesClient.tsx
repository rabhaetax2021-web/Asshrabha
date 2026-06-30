"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [addresses, setAddresses] = useState(initialAddresses)
  const [loading, setLoading] = useState(false)
  const [locations, setLocations] = useState<LocationOption[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState('')
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

  async function addAddress(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedLocationId) {
      showToast('Please choose a government from the list', 'error')
      return
    }

    if (addresses.length >= MAX_ADDRESSES) {
      showToast(`You can save up to ${MAX_ADDRESSES} addresses only.`, 'error')
      return
    }

    setLoading(true)
    try {
      const selectedLocation = locations.find((location) => location.id === selectedLocationId)
      const payload = {
        ...form,
        city: selectedLocation?.nameEN || selectedLocation?.nameAR || '',
        locationId: selectedLocationId,
      }

      const res = await fetch('/api/shop/profile/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: payload }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed to save address')
      setForm({ label: 'Home', fullName: '', mobile: '', addressLine: '', city: '', area: '', landmark: '', isDefault: false })
      setSelectedLocationId('')
      showToast('Address change submitted for admin approval', 'success')
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
      if (!res.ok) throw new Error(j?.error || 'Failed to set default address')
      showToast('Default address request submitted for admin approval', 'success')
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
      if (!res.ok) throw new Error(j?.error || 'Failed to remove address')
      showToast('Address deletion submitted for admin approval', 'success')
      router.refresh()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <form onSubmit={addAddress} className="card" style={{ padding: 'var(--space-5)', display: 'grid', gap: 'var(--space-3)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)' }}>Add New Address</h2>
        <div className="form-row">
          <label className="label">Label</label>
          <select className="input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="form-row">
          <label className="label">Full Name</label>
          <input className="input" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
        </div>
        <div className="form-row">
          <label className="label">Phone</label>
          <input className="input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
        </div>
        <div className="form-row">
          <label className="label">Address Line</label>
          <input className="input" value={form.addressLine} onChange={(e) => setForm({ ...form, addressLine: e.target.value })} required />
        </div>
        <div className="form-row">
          <label className="label">Government</label>
          <select
            className="input"
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value)}
            required
          >
            <option value="">-- Select Government --</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.nameAR || location.nameEN || location.id}
              </option>
            ))}
          </select>
        </div>
        <div className="form-row">
          <label className="label">Area</label>
          <input className="input" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
        </div>
        <div className="form-row">
          <label className="label">Landmark</label>
          <input className="input" value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} />
        </div>
        <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
          <label style={{ margin: 0 }}>Set as default address</label>
        </div>
        {addresses.length >= MAX_ADDRESSES ? (
          <div style={{ color: 'var(--text-error)', fontSize: 'var(--text-sm)' }}>
            You have reached the maximum of {MAX_ADDRESSES} saved addresses.
          </div>
        ) : null}
        <button type="submit" className="btn btn-primary" disabled={loading || !selectedLocationId || addresses.length >= MAX_ADDRESSES}>
          {loading ? 'Saving...' : 'Save Address'}
        </button>
      </form>

      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)' }}>Saved Addresses</h2>
        {addresses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No addresses saved yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {addresses.map((address) => (
              <div key={address.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <div style={{ fontWeight: 'var(--font-semibold)' }}>{address.label}</div>
                  {address.isDefault ? <span className="badge badge-success">Default</span> : null}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', display: 'grid', gap: 'var(--space-1)' }}>
                  <div>{address.fullName} · {address.mobile}</div>
                  <div>{address.addressLine}</div>
                  <div>{address.city}{address.area ? `, ${address.area}` : ''}</div>
                  {address.landmark ? <div>Landmark: {address.landmark}</div> : null}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeAddress(address.id)}
                    disabled={loading}
                  >
                    Remove
                  </button>
                  {!address.isDefault ? (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setDefaultAddress(address.id)}
                      disabled={loading}
                    >
                      Mark as default
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
