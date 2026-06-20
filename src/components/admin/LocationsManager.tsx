"use client"
import React, { useEffect, useState } from 'react'
import { showToast } from '@/components/ui/toast'

type Zone = {
  id: string
  providerId: string
  isActive: boolean
  shippingPrice?: number
  provider?: { id: string, shopNameEN?: string, shopNameAR?: string }
  location?: { id: string, nameEN?: string, nameAR?: string }
}

type Location = { id: string, nameEN: string, nameAR: string }
type Provider = { id: string, shopNameEN?: string, shopNameAR?: string }

export default function LocationsManager() {
  const [zones, setZones] = useState<Zone[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'location'|'zone'|null>(null)

  const [formLocation, setFormLocation] = useState({ nameEN: '', nameAR: '' })
  const [formZone, setFormZone] = useState({ providerId: '', locationId: '', isActive: true, shippingPrice: 0 })

  async function load() {
    setLoading(true)
    try {
      const [locRes, zonesRes, provRes] = await Promise.all([
        fetch('/api/admin/locations').then(r => r.json()),
        fetch('/api/admin/delivery-zones').then(r => r.json()),
        fetch('/api/admin/providers').then(r => r.json()),
      ])
      setLocations(locRes.ok ? locRes.locations : [])
      setZones(zonesRes.ok ? zonesRes.zones : [])
      setProviders(provRes.ok ? provRes.providers : [])
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function submitLocation() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/locations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formLocation) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Location created', 'success')
      setShowModal(false)
      setFormLocation({ nameEN: '', nameAR: '' })
      load()
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  async function submitZone() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/delivery-zones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formZone) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Delivery zone created', 'success')
      setShowModal(false)
      setFormZone({ providerId: '', locationId: '', isActive: true, shippingPrice: 0 })
      load()
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Locations</h3>
            <div>
              <button className="btn btn-primary" onClick={() => { setShowModal(true); setModalMode('location'); setFormLocation({ nameEN: '', nameAR: '' }) }}>New Location</button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name (EN)</th>
                <th>Name (AR)</th>
              </tr>
            </thead>
            <tbody>
              {locations.map(l => (
                <tr key={l.id}>
                  <td>{l.nameEN}</td>
                  <td>{l.nameAR}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3>Delivery Zones</h3>
            <div>
              <button className="btn btn-primary" onClick={() => { setShowModal(true); setModalMode('zone'); setFormZone({ providerId: '', locationId: '', isActive: true, shippingPrice: 0 }) }}>New Delivery Zone</button>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Location</th>
                <th>Shipping Price</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(z => (
                <tr key={z.id}>
                  <td>{z.provider?.shopNameEN || z.provider?.shopNameAR || '-'}</td>
                  <td>{z.location?.nameEN || z.location?.nameAR || '-'}</td>
                  <td>{(z.shippingPrice ?? 0).toFixed(2)}</td>
                  <td>{z.isActive ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            {modalMode === 'location' ? (
              <>
                <h3>New Location</h3>
                <div className="form-row">
                  <label>Name (EN)</label>
                  <input value={formLocation.nameEN} onChange={e => setFormLocation(f => ({ ...f, nameEN: e.target.value }))} />
                </div>
                <div className="form-row">
                  <label>Name (AR)</label>
                  <input value={formLocation.nameAR} onChange={e => setFormLocation(f => ({ ...f, nameAR: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={submitLocation} disabled={loading}>Create</button>
                  <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h3>New Delivery Zone</h3>
                <div className="form-row">
                  <label>Provider</label>
                  <select value={formZone.providerId} onChange={e => setFormZone(f => ({ ...f, providerId: e.target.value }))}>
                    <option value="">-- Select provider --</option>
                    {providers.map(p => <option key={p.id} value={p.id}>{p.shopNameEN || p.shopNameAR || p.id}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Location</label>
                  <select value={formZone.locationId} onChange={e => setFormZone(f => ({ ...f, locationId: e.target.value }))}>
                    <option value="">-- Select location --</option>
                    {locations.map(l => <option key={l.id} value={l.id}>{l.nameEN || l.nameAR}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Shipping Price</label>
                  <input type="number" value={formZone.shippingPrice} onChange={e => setFormZone(f => ({ ...f, shippingPrice: Number(e.target.value) }))} />
                </div>
                <div className="form-row">
                  <label><input type="checkbox" checked={formZone.isActive} onChange={e => setFormZone(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={submitZone} disabled={loading}>Create Zone</button>
                  <button className="btn" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
