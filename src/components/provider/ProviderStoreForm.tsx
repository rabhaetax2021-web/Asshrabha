"use client"

import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { getErrorMessage } from '@/lib/errors'

export default function ProviderStoreForm({ provider }: any) {
  const [form, setForm] = useState({
    shopNameEN: provider.shopNameEN || '',
    shopNameAR: provider.shopNameAR || '',
    descriptionEN: provider.descriptionEN || '',
    descriptionAR: provider.descriptionAR || '',
    logo: provider?.logo || '',
    banner: provider?.banner || '',
    locationPhoto: provider?.locationPhoto || '',
    defaultWholesaleUnit: (provider as any)?.defaultWholesaleUnit || '',
  })
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/provider/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider.id, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      showToast('Saved', 'success')
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, key: 'logo' | 'banner' | 'locationPhoto') => {
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
    <form onSubmit={submit} className="provider-store-form">
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
      <label className="label">Logo
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
        {form.logo && <div style={{marginTop:8}}><img src={form.logo} alt="logo" style={{maxWidth:120,maxHeight:80}}/></div>}
      </label>
      <label className="label">Banner
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
        {form.banner && <div style={{marginTop:8}}><img src={form.banner} alt="banner" style={{maxWidth:240,maxHeight:120}}/></div>}
      </label>
      <label className="label">Location Photo
        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'locationPhoto')} />
        {form.locationPhoto && <div style={{marginTop:8}}><img src={form.locationPhoto} alt="location" style={{maxWidth:240,maxHeight:120}}/></div>}
      </label>
      <label className="label">Default Wholesale Unit
        <select value={form.defaultWholesaleUnit} onChange={e => setForm({...form, defaultWholesaleUnit: e.target.value})}>
          <option value="">(none)</option>
          <option value="BOX">Box</option>
          <option value="PACK">Pack</option>
        </select>
      </label>
      <div>
        <button disabled={loading} className="btn btn-primary" type="submit">Save</button>
      </div>
    </form>
  )
}
