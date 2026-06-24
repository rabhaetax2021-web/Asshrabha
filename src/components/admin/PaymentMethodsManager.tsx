"use client"
import React, { useState } from 'react'
import { showToast } from '@/components/ui/toast'

export default function PaymentMethodsManager({ initial }: { initial: any[] }) {
  const [methods, setMethods] = useState(initial || [])
  const [name, setName] = useState('')
  const [instructions, setInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editInstructions, setEditInstructions] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  async function createMethod(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return showToast('Name required', 'error')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/wallet/payment-methods', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, instructions }) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setMethods([j.method, ...methods])
      setName('')
      setInstructions('')
      showToast('Payment method created', 'success')
    } catch (e: any) { showToast(e?.message || String(e), 'error') }
    finally { setLoading(false) }
  }

  return (
    <div>
      <form onSubmit={createMethod} className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Create Payment Method</h3>
        <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="input" style={{ marginBottom: 8 }} />
        <textarea placeholder="Instructions" value={instructions} onChange={e => setInstructions(e.target.value)} className="input" style={{ marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
        </div>
      </form>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Payment Methods</h3>
        {methods.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No methods yet.</p> : (
          <ul>
            {methods.map(m => (
              <li key={m.id} style={{ padding: 8, borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    {editingId === m.id ? (
                      <div>
                        <input className="input" value={editName} onChange={e => setEditName(e.target.value)} style={{ marginBottom: 6 }} />
                        <textarea className="input" value={editInstructions} onChange={e => setEditInstructions(e.target.value)} />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-2xs)' }}>{m.instructions}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span className={`badge ${m.active ? 'badge-success' : ''}`}>{m.active ? 'Active' : 'Inactive'}</span>
                    {editingId === m.id ? (
                      <>
                        <button className="btn btn-primary" onClick={async () => {
                          if (!editName.trim()) return showToast('Name required', 'error')
                          setEditLoading(true)
                          try {
                            const res = await fetch('/api/admin/wallet/payment-methods', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id, name: editName, instructions: editInstructions }) })
                            const j = await res.json()
                            if (!res.ok) throw new Error(j?.error || 'Failed')
                            setMethods(methods.map(mm => mm.id === m.id ? j.method : mm))
                            setEditingId(null)
                            showToast('Payment method updated', 'success')
                          } catch (e: any) { showToast(e?.message || String(e), 'error') }
                          finally { setEditLoading(false) }
                        }} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                        <button className="btn" onClick={() => { setEditingId(null); setEditName(''); setEditInstructions('') }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={() => { setEditingId(m.id); setEditName(m.name || ''); setEditInstructions(m.instructions || '') }}>Edit</button>
                        <button className="btn btn-danger" onClick={async () => {
                          if (!confirm('Delete this payment method?')) return
                          try {
                            const res = await fetch('/api/admin/wallet/payment-methods', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: m.id }) })
                            const j = await res.json()
                            if (!res.ok) throw new Error(j?.error || 'Failed')
                            setMethods(methods.filter(mm => mm.id !== m.id))
                            showToast('Payment method deleted', 'success')
                          } catch (e: any) { showToast(e?.message || String(e), 'error') }
                        }}>Delete</button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
