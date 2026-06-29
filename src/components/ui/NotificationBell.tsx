"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import Button from './Button'
import Icon from './Icon'
import { formatRelativeTime } from '@/lib/utils/helpers'
import type { NotificationItem } from '@/types'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)

  const canPush = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window

  useEffect(() => {
    setPermission(typeof window !== 'undefined' ? Notification.permission : 'default')
  }, [])

  useEffect(() => {
    let active = true
    const loadNotifications = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/notifications', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        setItems(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 20000)
    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.EventSource) return

    const es = new EventSource('/api/notifications/stream')
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload?.type === 'notification' && payload.payload) {
          const notification = payload.payload as NotificationItem
          setItems((prev) => [notification, ...prev].slice(0, 20))
          setUnreadCount((count) => count + (notification.isRead ? 0 : 1))
        }
        if (payload?.type === 'initial' && Array.isArray(payload.payload)) {
          setItems(payload.payload)
          setUnreadCount(payload.payload.filter((item: NotificationItem) => !item.isRead).length)
        }
      } catch {
        // ignore malformed SSE payload
      }
    }
    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (open && panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [open])

  const updateReadState = async (ids: string[]) => {
    try {
      const res = await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      })
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.unreadCount ?? 0)
      setItems((prev) => prev.map((item) => (ids.includes(item.id) ? { ...item, isRead: true } : item)))
    } catch {
      // ignore
    }
  }

  const markAllRead = () => {
    updateReadState(items.filter((item) => !item.isRead).map((item) => item.id))
  }

  const requestPermission = async () => {
    if (!canPush) {
      setError('Browser notifications are not supported in this environment.')
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        await registerSubscription()
      }
    } catch (err) {
      setError('Unable to request notification permission.')
    }
  }

  const registerSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!subscription) {
        if (!publicKey) {
          setError('Push subscription is not configured. Please provide NEXT_PUBLIC_VAPID_PUBLIC_KEY.')
          return
        }
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
      }

      setError(null)
      setLoading(true)
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })
    } catch (err) {
      setError('Unable to register push subscription.')
    } finally {
      setLoading(false)
    }
  }

  const panelLabel = useMemo(() => {
    if (unreadCount === 0) return 'No new notifications'
    return `${unreadCount} new notification${unreadCount > 1 ? 's' : ''}`
  }, [unreadCount])

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="btn-icon btn-ghost"
        aria-label="Open notifications"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="Bell" size={20} />
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>
      {open && (
        <div className="notification-menu">
          <div className="notification-menu-header">
            <div>
              <strong>Notifications</strong>
              <div className="notification-menu-subtitle">{panelLabel}</div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={markAllRead}>
              Mark all read
            </button>
          </div>

          {canPush && permission !== 'granted' && (
            <div className="notification-permission-banner">
              <div>Enable browser notifications for push updates.</div>
              <Button size="sm" onClick={requestPermission} disabled={loading}>
                {loading ? 'Saving…' : 'Enable' }
              </Button>
            </div>
          )}

          {error && <div className="notification-error">{error}</div>}

          <div className="notification-list">
            {items.length === 0 ? (
              <div className="notification-empty">No notifications yet.</div>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`notification-item ${item.isRead ? '' : 'notification-item-unread'}`}
                  onClick={() => {
                    if (!item.isRead) updateReadState([item.id])
                    if (item.data?.url && typeof item.data.url === 'string') {
                      window.location.href = item.data.url
                    }
                  }}
                >
                  <div className="notification-item-body">
                    <div className="notification-item-title">{item.titleEN || item.titleAR}</div>
                    <div className="notification-item-text">{item.bodyEN || item.bodyAR || ''}</div>
                  </div>
                  <div className="notification-item-time">{formatRelativeTime(item.createdAt, document.documentElement.lang === 'ar' ? 'ar' : 'en')}</div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
