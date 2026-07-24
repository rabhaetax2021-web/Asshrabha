"use client"

import { useState } from 'react';
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function ProviderStoreForm({ provider }: any) {
  const [form, setForm] = useState({
    shopNameEN: provider.shopNameEN || '',
    shopNameAR: provider.shopNameAR || '',
    descriptionEN: provider.descriptionEN || '',
    descriptionAR: provider.descriptionAR || '',
    minOrderItems: provider?.minOrderItems ?? '',
    minOrderAmount: provider?.minOrderAmount ?? '',
    logo: provider?.logo || '',
    banner: provider?.banner || '',
  })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        providerId: provider.id,
        shopNameEN: form.shopNameEN,
        shopNameAR: form.shopNameAR,
        descriptionEN: form.descriptionEN,
        descriptionAR: form.descriptionAR,
        minOrderItems: form.minOrderItems === '' ? undefined : Number(form.minOrderItems),
        minOrderAmount: form.minOrderAmount === '' ? undefined : Number(form.minOrderAmount),
        logo: form.logo,
        banner: form.banner,
      }
      const res = await fetch('/api/provider/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      showToast(data?.status === 'pending-review' ? 'Your store changes were submitted for admin approval.' : 'Saved', 'success')
      window.location.reload()
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    return res.json()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'banner') => {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      setLoading(true)
      const data: any = await uploadFile(f)
      if (data?.ok && data.path) {
        setForm(prev => ({ ...prev, [key]: data.path }))
        showToast('Uploaded', 'success')
      } else {
        showToast(data?.error || 'Upload failed', 'error')
      }
    } catch (err: unknown) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="provider-store-form" style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div className="card" style={{ padding: 'var(--space-4)', background: 'linear-gradient(135deg, var(--primary-50), white)', border: '1px solid var(--primary-100)' }}>
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--primary)', marginBottom: 'var(--space-2)' }}>Store policy</div>
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
          These purchase rules are unique to your store. Customers will see the requirements for your shop only, so each provider can set a different minimum order experience.
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Store identity</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label className="label">Shop Name (EN)
            <input className="input" value={form.shopNameEN} onChange={e => setForm({...form, shopNameEN: e.target.value})} />
          </label>
          <label className="label">Shop Name (AR)
            <input className="input" value={form.shopNameAR} onChange={e => setForm({...form, shopNameAR: e.target.value})} />
          </label>
          <label className="label">Description (EN)
            <textarea className="textarea" value={form.descriptionEN} onChange={e => setForm({...form, descriptionEN: e.target.value})} />
          </label>
          <label className="label">Description (AR)
            <textarea className="textarea" value={form.descriptionAR} onChange={e => setForm({...form, descriptionAR: e.target.value})} />
          </label>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Purchase conditions</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label className="label">Minimum order items
            <input type="number" min="0" step="1" className="input" value={form.minOrderItems} onChange={e => setForm({...form, minOrderItems: e.target.value})} />
          </label>
          <label className="label">Minimum order amount (EGP)
            <input type="number" min="0" step="0.01" className="input" value={form.minOrderAmount} onChange={e => setForm({...form, minOrderAmount: e.target.value})} />
          </label>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
            Leave these empty if you do not want any minimum purchase requirement for your store.
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 'var(--space-4)' }}>
        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-semibold)', marginBottom: 'var(--space-3)' }}>Media & defaults</h3>
        <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <label className="label">Logo
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
            {form.logo && <div style={{marginTop:8}}><img src={form.logo} alt="logo" style={{maxWidth:120,maxHeight:80}}/></div>}
          </label>
          <label className="label">Banner
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
            {form.banner && <div style={{marginTop:8}}><img src={form.banner} alt="banner" style={{maxWidth:240,maxHeight:120}}/></div>}
          </label>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button disabled={loading} className="btn btn-primary" type="submit">{loading ? 'Saving...' : 'Save store settings'}</button>
      </div>
    </form>
  )
}
