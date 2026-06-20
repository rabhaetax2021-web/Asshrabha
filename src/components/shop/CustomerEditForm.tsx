"use client"
import React from 'react'
import { useRouter } from 'next/navigation'

export default function CustomerEditForm({ user }: { user: any }) {
  const router = useRouter()
  const [nameEN, setNameEN] = React.useState(user?.nameEN || '')
  const [nameAR, setNameAR] = React.useState(user?.nameAR || '')
  const [mobile, setMobile] = React.useState(user?.mobile || '')
  const [email, setEmail] = React.useState(user?.email || '')
  const [avatar, setAvatar] = React.useState(user?.avatar || '')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Address fields
  const [addressLabel, setAddressLabel] = React.useState('Home')
  const [fullName, setFullName] = React.useState(user?.nameEN || user?.nameAR || '')
  const [addressMobile, setAddressMobile] = React.useState(user?.mobile || '')
  const [addressLine, setAddressLine] = React.useState('')
  const [city, setCity] = React.useState('')
  const [area, setArea] = React.useState('')
  const [landmark, setLandmark] = React.useState('')
  const [isDefault, setIsDefault] = React.useState(false)

  async function uploadFile(f: File) {
    const fd = new FormData()
    fd.append('file', f)
    const r = await fetch('/api/upload', { method: 'POST', body: fd })
    if (!r.ok) throw new Error('upload failed')
    const j = await r.json()
    return j?.path || j?.data?.path || ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const changes: any = {
        user: {
          nameEN: nameEN || null,
          nameAR: nameAR || null,
          mobile: mobile || null,
          email: email || null,
          avatar: avatar || null,
        }
      }

      // Include address if any field is filled
      if (addressLine || city) {
        changes.address = {
          label: addressLabel || 'Home',
          fullName: fullName || nameEN || nameAR || 'Customer',
          mobile: addressMobile || mobile || '',
          addressLine: addressLine || '',
          city: city || '',
          area: area || null,
          landmark: landmark || null,
          isDefault,
        }
      }

      const res = await fetch('/api/shop/profile/edit-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      router.push('/shop/profile')
    } catch (err: any) {
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="admin-form">
      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
        👤 Personal Information
      </h3>
      <div className="form-row">
        <label className="label">Name (EN)</label>
        <input className="input" value={nameEN} onChange={e => setNameEN(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Name (AR)</label>
        <input className="input" value={nameAR} onChange={e => setNameAR(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Mobile</label>
        <input className="input" value={mobile} onChange={e => setMobile(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Email</label>
        <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="form-row">
        <label className="label">Avatar</label>
        <input type="file" accept="image/*" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          setLoading(true)
          try {
            const p = await uploadFile(f)
            setAvatar(p)
          } catch (err: any) { setError(err.message || String(err)) }
          finally { setLoading(false) }
        }} />
        {avatar && <div style={{ marginTop: 8 }}><img src={avatar} alt="avatar" style={{ width: 96, height: 96, borderRadius: 48 }} /><button type="button" className="btn btn-ghost" onClick={() => setAvatar('')}>Remove</button></div>}
      </div>

      <hr style={{ margin: 'var(--space-6) 0', border: '1px solid var(--border-light)' }} />

      <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-4)', color: 'var(--text-primary)' }}>
        📍 Address Information
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
        Fill in your delivery address. This will be saved for future orders.
      </p>
      <div className="form-row">
        <label className="label">Address Label</label>
        <select className="input" value={addressLabel} onChange={e => setAddressLabel(e.target.value)}>
          <option value="Home">Home</option>
          <option value="Work">Work</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="form-row">
        <label className="label">Full Name</label>
        <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Name for delivery" />
      </div>
      <div className="form-row">
        <label className="label">Address Phone</label>
        <input className="input" value={addressMobile} onChange={e => setAddressMobile(e.target.value)} placeholder="Phone number for delivery" />
      </div>
      <div className="form-row">
        <label className="label">Address Line</label>
        <input className="input" value={addressLine} onChange={e => setAddressLine(e.target.value)} placeholder="Street, building, apartment number" />
      </div>
      <div className="form-row">
        <label className="label">City</label>
        <input className="input" value={city} onChange={e => setCity(e.target.value)} placeholder="City" />
      </div>
      <div className="form-row">
        <label className="label">Area / Neighborhood</label>
        <input className="input" value={area} onChange={e => setArea(e.target.value)} placeholder="Area or neighborhood" />
      </div>
      <div className="form-row">
        <label className="label">Landmark</label>
        <input className="input" value={landmark} onChange={e => setLandmark(e.target.value)} placeholder="Nearby landmark (optional)" />
      </div>
      <div className="form-row" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <input type="checkbox" id="isDefault" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
        <label htmlFor="isDefault" style={{ margin: 0, fontWeight: 'var(--font-medium)' }}>Set as default address</label>
      </div>

      {error && <div className="form-error" style={{ marginTop: 'var(--space-4)' }}>{error}</div>}
      <div className="form-actions" style={{ marginTop: 'var(--space-6)' }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for Approval'}
        </button>
      </div>
    </form>
  )
}
