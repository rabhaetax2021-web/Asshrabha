"use client"
import React, { useEffect, useState } from 'react'
import { showToast } from '@/components/ui/toast'

type AdminRow = { id: string; mobile: string; nameEN?: string | null; nameAR?: string | null; role: string; status: string; createdAt?: string; permissions?: string[] }

export default function AdminsManager() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(false)
  const [mobile, setMobile] = useState('')
  const [nameEN, setNameEN] = useState('')
  const [nameAR, setNameAR] = useState('')
  const [role, setRole] = useState('SUB_ADMIN')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNameEN, setEditNameEN] = useState('')
  const [editNameAR, setEditNameAR] = useState('')
  const [editRole, setEditRole] = useState('SUB_ADMIN')
  const [editStatus, setEditStatus] = useState('APPROVED')
  const [editPassword, setEditPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/admins')
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setAdmins(j.admins || [])
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createAdmin(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!mobile.trim()) return showToast('Mobile required', 'error')
    setCreating(true)
    try {
      const res = await fetch('/api/admin/admins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mobile: mobile.trim(), nameEN: nameEN.trim() || undefined, nameAR: nameAR.trim() || undefined, role }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Admin created', 'success')
      if (j.password) showToast(`Password: ${j.password}`, 'info')
      setMobile(''); setNameEN(''); setNameAR('')
      load()
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setCreating(false) }
  }

  function startEdit(admin: AdminRow) {
    setEditingId(admin.id)
    setEditNameEN(admin.nameEN || '')
    setEditNameAR(admin.nameAR || '')
    setEditRole(admin.role)
    setEditStatus(admin.status)
    setEditPassword('')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditPassword('')
  }

  async function saveAdmin() {
    if (!editingId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          nameEN: editNameEN.trim(),
          nameAR: editNameAR.trim(),
          role: editRole,
          status: editStatus,
          password: editPassword.trim() || undefined,
        }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Admin updated', 'success')
      cancelEdit()
      load()
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setSaving(false) }
  }

  async function deleteAdmin(id: string) {
    if (!window.confirm('Delete this admin? This cannot be undone.')) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast('Admin deleted', 'success')
      load()
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <input placeholder="Mobile" value={mobile} onChange={e => setMobile(e.target.value)} className="input" />
        <input placeholder="Name EN" value={nameEN} onChange={e => setNameEN(e.target.value)} className="input" />
        <input placeholder="Name AR" value={nameAR} onChange={e => setNameAR(e.target.value)} className="input" />
        <select value={role} onChange={e => setRole(e.target.value)} className="input">
          <option value="SUB_ADMIN">Sub Admin</option>
          <option value="ROOT_ADMIN">Root Admin</option>
        </select>
        <button className="btn btn-primary" onClick={createAdmin} disabled={creating}>{creating ? 'Creating...' : 'Add Admin'}</button>
      </div>

      <div className="card">
        <h3>Admins</h3>
        {loading ? <div>Loading...</div> : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: 8 }}>Mobile</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Role</th>
                  <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                  
                  <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td style={{ padding: 8 }}>{a.mobile}</td>
                    <td style={{ padding: 8 }}>
                      {editingId === a.id ? (
                        <input value={editNameEN} onChange={e => setEditNameEN(e.target.value)} className="input" />
                      ) : (
                        a.nameEN || a.nameAR || '-'
                      )}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editingId === a.id ? (
                        <select value={editRole} onChange={e => setEditRole(e.target.value)} className="input">
                          <option value="SUB_ADMIN">Sub Admin</option>
                          <option value="ROOT_ADMIN">Root Admin</option>
                        </select>
                      ) : (
                        a.role
                      )}
                    </td>
                    <td style={{ padding: 8 }}>
                      {editingId === a.id ? (
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="input">
                          <option value="APPROVED">APPROVED</option>
                          <option value="PENDING">PENDING</option>
                          <option value="REJECTED">REJECTED</option>
                          <option value="SUSPENDED">SUSPENDED</option>
                          <option value="DISABLED">DISABLED</option>
                        </select>
                      ) : (
                        a.status
                      )}
                    </td>
                    
                    <td style={{ padding: 8 }}>
                      {editingId === a.id ? (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-primary" onClick={saveAdmin} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                          <button type="button" className="btn btn-secondary" onClick={cancelEdit}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button type="button" className="btn btn-secondary" onClick={() => startEdit(a)}>Edit</button>
                          <button type="button" className="btn btn-danger" onClick={() => deleteAdmin(a.id)}>Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
