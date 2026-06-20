"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'
import { useRouter } from 'next/navigation'

export default function UserAvatarForm({ initialAvatar }: { initialAvatar?: string | null }) {
  const [avatar, setAvatar] = useState<string | null>(initialAvatar || null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await fetch('/api/user/avatar', { method: 'POST', body: fd })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Upload failed')
      setAvatar(j.path || null)
      showToast('Avatar updated', 'success')
      try { router.refresh() } catch (e) { /* ignore */ }
      // optionally refresh the page to update server-rendered parts
    } catch (err: any) {
      showToast(err.message || String(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div>
        {avatar ? (
          <img src={avatar} alt="avatar" style={{ width: 96, height: 96, borderRadius: 999, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: 96, height: 96, borderRadius: 999, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🙂</div>
        )}
      </div>
      <div>
        <input type="file" accept="image/*" onChange={handleFile} disabled={loading} />
      </div>
    </div>
  )
}
