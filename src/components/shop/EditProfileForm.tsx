"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function EditProfileForm({ profile, user }: any) {
  const router = useRouter()
  const [shopNameEN, setShopNameEN] = React.useState(profile?.shopNameEN || '')
  const [shopNameAR, setShopNameAR] = React.useState(profile?.shopNameAR || '')
  const [descriptionEN, setDescriptionEN] = React.useState(profile?.descriptionEN || '')
  const [descriptionAR, setDescriptionAR] = React.useState(profile?.descriptionAR || '')
  const [locationAddress, setLocationAddress] = React.useState(profile?.locationAddress || '')
  const [locationLat, setLocationLat] = React.useState(profile?.locationLat || '')
  const [locationLng, setLocationLng] = React.useState(profile?.locationLng || '')
  const [mobile, setMobile] = React.useState(user?.mobile || '')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [logo, setLogo] = React.useState(profile?.logo || '')
  const [banner, setBanner] = React.useState(profile?.banner || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const changes: any = {
        providerProfile: {
          shopNameEN: shopNameEN || null,
          shopNameAR: shopNameAR || null,
          descriptionEN: descriptionEN || null,
          descriptionAR: descriptionAR || null,
          locationAddress: locationAddress || null,
          locationLat: locationLat ? Number(locationLat) : null,
          locationLng: locationLng ? Number(locationLng) : null,
          logo: logo || null,
          banner: banner || null,
        },
        user: {
          mobile: mobile || null,
        }
      }

      const res = await fetch('/api/shop/profile/edit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ providerId: profile.id, changes }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      // show pending message then redirect to profile
      router.push('/shop/profile')
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <div className="form-row">
        <label>Shop Name (EN)</label>
        <input value={shopNameEN} onChange={e => setShopNameEN(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Shop Name (AR)</label>
        <input value={shopNameAR} onChange={e => setShopNameAR(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Description (EN)</label>
        <textarea value={descriptionEN} onChange={e => setDescriptionEN(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Description (AR)</label>
        <textarea value={descriptionAR} onChange={e => setDescriptionAR(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Location Address</label>
        <input value={locationAddress} onChange={e => setLocationAddress(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Logo</label>
        <input type="file" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setLoading(true)
          try {
            const fd = new FormData()
            fd.append('file', f)
            const r = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!r.ok) throw new Error('upload failed')
            const j = await r.json()
            const p = j?.path || j?.data?.path || null
            if (p) setLogo(p)
          } catch (err) {
            setError((err as any)?.message || String(err))
          } finally { setLoading(false) }
        }} />
        {logo && <div style={{ marginTop: 8 }}><img src={logo} alt="logo" style={{ maxWidth: 160, borderRadius: 6 }} /><button type="button" className="btn" onClick={() => setLogo('')}>Remove</button></div>}
      </div>
      <div className="form-row">
        <label>Banner</label>
        <input type="file" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setLoading(true)
          try {
            const fd = new FormData()
            fd.append('file', f)
            const r = await fetch('/api/upload', { method: 'POST', body: fd })
            if (!r.ok) throw new Error('upload failed')
            const j = await r.json()
            const p = j?.path || j?.data?.path || null
            if (p) setBanner(p)
          } catch (err) {
            setError((err as any)?.message || String(err))
          } finally { setLoading(false) }
        }} />
        {banner && <div style={{ marginTop: 8 }}><img src={banner} alt="banner" style={{ width: '100%', maxWidth: 320, borderRadius: 6 }} /><button type="button" className="btn" onClick={() => setBanner('')}>Remove</button></div>}
      </div>
      <div className="form-row">
        <label>Location Lat</label>
        <input value={String(locationLat)} onChange={e => setLocationLat(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Location Lng</label>
        <input value={String(locationLng)} onChange={e => setLocationLng(e.target.value)} />
      </div>
      <div className="form-row">
        <label>Mobile</label>
        <input value={mobile} onChange={e => setMobile(e.target.value)} />
      </div>
      {error && <div className="form-error">{error}</div>}
      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit for Approval'}</button>
      </div>
    </form>
  )
}
