"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getErrorMessage } from '@/lib/errors'

export default function CustomerEditForm({ user }: { user: any }) {
  const router = useRouter()
  const [nameEN, setNameEN] = useState(user?.nameEN || '')
  const [nameAR, setNameAR] = useState(user?.nameAR || '')
  const [mobile, setMobile] = useState(user?.mobile || '')
  const [email, setEmail] = useState(user?.email || '')
  const [avatar, setAvatar] = useState(user?.avatar || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const res = await fetch('/api/shop/profile/edit-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      router.push('/shop/profile')
    } catch (err: unknown) {
      setError(getErrorMessage(err))
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
          } catch (err: unknown) { setError(getErrorMessage(err)) }
          finally { setLoading(false) }
        }} />
        {avatar && <div style={{ marginTop: 8 }}><img src={avatar} alt="avatar" style={{ width: 96, height: 96, borderRadius: 48 }} /><button type="button" className="btn btn-ghost" onClick={() => setAvatar('')}>Remove</button></div>}
      </div>

      <hr style={{ margin: 'var(--space-6) 0', border: '1px solid var(--border-light)' }} />

      <div className="card" style={{ padding: 'var(--space-4)', background: 'var(--bg-secondary)' }}>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
          Addresses are managed separately. Use the dedicated address manager to add, remove, or update your saved delivery addresses.
        </p>
        <Link href="/shop/profile/addresses" className="btn btn-ghost" style={{ marginTop: 'var(--space-3)', width: 'fit-content' }}>
          Manage Addresses
        </Link>
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
