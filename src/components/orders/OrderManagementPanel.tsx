"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'REFUNDED']

export default function OrderManagementPanel({ order, isAdmin = false }: { order: any; isAdmin?: boolean }) {
  const t = useTranslations(isAdmin ? 'admin' : 'provider')
  const tc = useTranslations('common')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [items, setItems] = useState(order?.items || [])
  const [editingQuantityId, setEditingQuantityId] = useState<string | null>(null)
  const [quantityDrafts, setQuantityDrafts] = useState<Record<string, string>>({})

  const updateStatus = async (nextStatus: string) => {
    if (!confirm(`${tc('confirmAction')} ${t('changeStatus') || 'Change status'}?`)) return
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/${isAdmin ? 'admin' : 'provider'}/orders/${order.id}/status`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to update status')
      setMessage(tc('success'))
      router.refresh()
    } catch (err: any) {
      setMessage(err?.message || tc('error'))
    } finally {
      setLoading(false)
    }
  }

  const submitItemAction = async (action: string, itemId: string, quantity?: number) => {
    setLoading(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/${isAdmin ? 'admin' : 'provider'}/orders/${order.id}/modify`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, orderItemId: itemId, newQuantity: quantity }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'failed')
      if (action === 'REDUCE_QUANTITY' && typeof quantity === 'number') {
        setItems((prev: any[]) => prev.map((it) => it.id === itemId ? { ...it, quantity, totalPrice: (it.unitPrice || 0) * quantity } : it))
        setEditingQuantityId(null)
      }
      if (action === 'REMOVE_PRODUCT') {
        setItems((prev: any[]) => prev.map((it) => it.id === itemId ? { ...it, quantity: 0, totalPrice: 0 } : it))
      }
      setMessage(tc('success'))
      router.refresh()
    } catch (err: any) {
      setMessage(err?.message || tc('error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="order-management-panel" style={{ display: 'grid', gap: 20 }}>
      {message && <div className="notice">{message}</div>}

      <CardSection title={isAdmin ? 'Status' : t('status')}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <select value={order.status} onChange={(e) => updateStatus(e.target.value)} disabled={loading} className="input">
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          {loading && <span>{tc('loading')}</span>}
        </div>
      </CardSection>

      <CardSection title={t('actions') || tc('actions')}>
        <div className="order-actions-grid">
          {items.map((it: any) => {
            const currentQty = Number(it.quantity || 0)
            const isRemoved = currentQty === 0
            return (
              <div key={it.id} className="order-item-card" style={{ opacity: isRemoved ? 0.65 : 1 }}>
                <div style={{ fontWeight: 600 }}>
                  {it.providerProduct?.catalogProduct?.nameEN || it.providerProduct?.catalogProduct?.nameAR || 'Product'}
                </div>
                <div>{tc('quantity')}: {isRemoved ? tc('removed') || 'Removed' : currentQty}</div>
                <div>{tc('price')}: {Number(it.unitPrice || 0).toFixed(2)} EGP</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  <button className="btn btn-outline" onClick={() => submitItemAction('MARK_UNAVAILABLE', it.id)} disabled={loading || isRemoved}>{t('markUnavailable') || 'Mark unavailable'}</button>
                  <button className="btn btn-outline" onClick={() => {
                    const q = Math.max(1, currentQty - 1)
                    submitItemAction('REDUCE_QUANTITY', it.id, q)
                  }} disabled={loading || isRemoved}>{t('reduceQuantity') || 'Reduce by 1'}</button>
                  <button className="btn btn-outline" onClick={() => {
                    const next = window.prompt(tc('enterQuantity') || 'Enter new quantity', String(currentQty || 1))
                    if (next === null) return
                    const parsed = Number(next)
                    if (!Number.isInteger(parsed) || parsed <= 0 || parsed >= currentQty) {
                      setMessage(t('invalidQuantity') || 'Quantity must be between 1 and current quantity')
                      return
                    }
                    submitItemAction('REDUCE_QUANTITY', it.id, parsed)
                  }} disabled={loading || isRemoved}>{t('setQuantity') || 'Set quantity'}</button>
                  <button className="btn btn-danger" onClick={() => submitItemAction('REMOVE_PRODUCT', it.id)} disabled={loading || isRemoved}>{t('removeProduct') || 'Remove product'}</button>
                </div>
              </div>
            )
          })}
        </div>
      </CardSection>
    </div>
  )
}

function CardSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card glass" style={{ padding: 16, borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ margin: '0 0 12px' }}>{title}</h3>
      {children}
    </section>
  )
}
