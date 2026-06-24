"use client"
import React, { useEffect, useState } from 'react'
import { showToast } from '@/components/ui/toast'

type UserRow = { id: string; mobile: string; nameEN?: string | null; nameAR?: string | null }

export default function MarketingMessenger() {
  const [providers, setProviders] = useState<UserRow[]>([])
  const [customers, setCustomers] = useState<UserRow[]>([])
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const [selectAllProviders, setSelectAllProviders] = useState(false)
  const [selectAllCustomers, setSelectAllCustomers] = useState(false)
  const [filter, setFilter] = useState<'providers' | 'customers' | 'all'>('providers')
  const [template, setTemplate] = useState<'Marketing_Msg' | 'OTP' | 'Custom'>('Marketing_Msg')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/admin/marketing')
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      setProviders(j.providers || [])
      setCustomers(j.customers || [])
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    }
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (selectAllProviders) {
      const map = { ...selected }
      providers.forEach(p => map[p.id] = true)
      setSelected(map)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAllProviders])

  useEffect(() => {
    if (selectAllCustomers) {
      const map = { ...selected }
      customers.forEach(p => map[p.id] = true)
      setSelected(map)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectAllCustomers])

  function toggle(id: string) {
    setSelected(s => ({ ...s, [id]: !s[id] }))
  }

  async function send() {
    setSending(true)
    try {
      const recipientIds = Object.keys(selected).filter(id => selected[id])
      const body: any = {}
      if (recipientIds.length > 0) body.recipients = recipientIds
      else body.filter = filter === 'all' ? 'all' : filter
      if (template === 'Custom') body.message = message
      else body.templateName = template

      const res = await fetch('/api/admin/marketing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'Failed')
      showToast(`Sent to ${j.count} recipients (queued)`, 'success')
    } catch (e: any) {
      showToast(e?.message || String(e), 'error')
    } finally { setSending(false) }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Send Marketing / OTP Messages</h3>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
        <label>Target:</label>
        <select value={filter} onChange={e => setFilter(e.target.value as any)} className="input">
          <option value="providers">Providers</option>
          <option value="customers">Customers</option>
          <option value="all">All Users</option>
        </select>
        <label style={{ marginLeft: 12 }}>Template:</label>
        <select value={template} onChange={e => setTemplate(e.target.value as any)} className="input">
          <option value="Marketing_Msg">Marketing_Msg</option>
          <option value="OTP">OTP</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      {template === 'Custom' && (
        <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Custom message" rows={3} className="input" />
      )}

      <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <h4>Providers <button className="btn" onClick={() => setSelectAllProviders(s => !s)}>{selectAllProviders ? 'Unselect all' : 'Select all'}</button></h4>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
            {providers.map(p => (
              <div key={p.id}><label><input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} /> {p.mobile} - {p.nameEN || p.nameAR}</label></div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <h4>Customers <button className="btn" onClick={() => setSelectAllCustomers(s => !s)}>{selectAllCustomers ? 'Unselect all' : 'Select all'}</button></h4>
          <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #eee', padding: 8 }}>
            {customers.map(p => (
              <div key={p.id}><label><input type="checkbox" checked={!!selected[p.id]} onChange={() => toggle(p.id)} /> {p.mobile} - {p.nameEN || p.nameAR}</label></div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <button className="btn btn-primary" onClick={send} disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</button>
      </div>
    </div>
  )
}
