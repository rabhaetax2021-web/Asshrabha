"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Button from './Button'
import Icon from './Icon'
import { formatRelativeTime } from '@/lib/utils/helpers'
import { getVapidPublicKey } from '@/lib/notifications/vapid'
import type { NotificationItem } from '@/types'

function urlBase64ToUint8Array(base64String: string) {
  const normalized = base64String.trim().replace(/\s+/g, '')
  if (!normalized) {
    throw new Error('Empty VAPID public key')
  }

  const padding = '='.repeat((4 - (normalized.length % 4)) % 4)
  const base64 = (normalized + padding).replace(/-/g, '+').replace(/_/g, '/')

  if (!/^[A-Za-z0-9+/]+=*$/.test(base64)) {
    throw new Error(`Invalid VAPID public key format: ${normalized}`)
  }

  try {
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  } catch (error) {
    throw new Error(`Invalid VAPID public key: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export default function NotificationBell() {
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const playNotificationSound = useCallback(async () => {
    if (typeof window === 'undefined') return

    try {
      // Let the browser/device play its native notification sound.
      // This avoids autoplay/audio context issues on mobile and desktop.
    } catch {
      // Ignore autoplay restrictions; the browser notification itself will still appear.
    }
  }, [])

  const canPush = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window

  useEffect(() => {
    setPermission(typeof window !== 'undefined' ? Notification.permission : 'default')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleUserInteraction = () => {
      // No-op: the browser/device handles the notification sound natively.
    }

    window.addEventListener('pointerdown', handleUserInteraction, { once: true, passive: true })
    window.addEventListener('keydown', handleUserInteraction, { once: true })

    return () => {
      window.removeEventListener('pointerdown', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])

  useEffect(() => {
    let active = true
    let refreshTimer: number | null = null

    const loadNotifications = async () => {
      try {
        setError(null)
        setLoading(true)
        const res = await fetch('/api/notifications', { cache: 'no-store', credentials: 'same-origin' })
        if (!res.ok) return
        const data = await res.json()
        if (!active) return
        setItems(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      } catch {
        if (active) setError(labels.loadError)
      } finally {
        if (active) setLoading(false)
      }
    }

    const refreshNotifications = () => {
      if (!active || typeof document === 'undefined' || document.visibilityState === 'hidden') return
      void loadNotifications()
    }

    refreshNotifications()

    if (typeof window !== 'undefined') {
      refreshTimer = window.setInterval(() => {
        refreshNotifications()
      }, 60000)
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshNotifications()
    }
    const handleFocus = () => {
      refreshNotifications()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      active = false
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      if (refreshTimer !== null) window.clearInterval(refreshTimer)
    }
  }, [])

  const playNotificationSoundRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    playNotificationSoundRef.current = () => {
      void playNotificationSound()
    }
  }, [playNotificationSound])

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
        credentials: 'same-origin',
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

  const getClientVapidPublicKey = async () => {
    const localKey = getVapidPublicKey()
    if (localKey) return localKey

    try {
      const res = await fetch('/api/notifications/vapid-key', { cache: 'no-store', credentials: 'same-origin' })
      if (!res.ok) return null
      const data = await res.json()
      return typeof data.publicKey === 'string' && data.publicKey.trim() ? data.publicKey.trim() : null
    } catch {
      return null
    }
  }

  const requestPermission = async () => {
    if (!canPush) {
      setError(labels.unsupported)
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === 'granted') {
        await registerSubscription()
      }
    } catch {
      setError(labels.permissionError)
    }
  }

  const registerSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      let subscription = await registration.pushManager.getSubscription()
      const publicKey = await getClientVapidPublicKey()

      if (!publicKey) {
        setError(labels.missingVapidKey)
        return
      }

      if (!subscription) {
        try {
          const subscribeOptions: PushSubscriptionOptionsInit = {
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          }

          subscription = await registration.pushManager.subscribe(subscribeOptions)
        } catch (subscribeError) {
          console.error('[notifications] subscribe failed', subscribeError)
          const message = subscribeError instanceof Error ? subscribeError.message : String(subscribeError)
          setError(`${labels.registerError}\n${message}`)
          return
        }
      }

      setError(null)
      setLoading(true)

      const subscribeRes = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!subscribeRes.ok) {
        const responseText = await subscribeRes.text()
        console.error('[notifications] save subscription failed', responseText)
        setError(`${labels.registerError}\n${responseText}`)
        return
      }
    } catch (error) {
      console.error('[notifications] registration failed', error)
      const message = error instanceof Error ? error.message : String(error)
      setError(`${labels.registerError}\n${message}`)
    } finally {
      setLoading(false)
    }
  }

  const panelLabel = useMemo(() => {
    if (unreadCount === 0) return 'لا توجد إشعارات جديدة'
    return unreadCount === 1 ? 'إشعار جديد واحد' : `${unreadCount} إشعارات جديدة`
  }, [unreadCount])

  const unreadItems = useMemo(() => items.filter((item) => !item.isRead), [items])

  const labels = {
    open: 'فتح الإشعارات',
    title: 'الإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    enableBrowser: 'فعّل إشعارات المتصفح للتحديثات الفورية.',
    enable: 'تفعيل',
    saving: 'جارٍ الحفظ…',
    empty: 'لا توجد إشعارات بعد.',
    unsupported: 'إشعارات المتصفح غير مدعومة في هذه البيئة.',
    permissionError: 'تعذر طلب إذن الإشعارات.',
    loadError: 'تعذر تحميل الإشعارات. يرجى المحاولة مرة أخرى.',
    registerError: 'تعذر تسجيل اشتراك الإشعارات.',
    missingVapidKey: 'مفتاح VAPID مفقود أو غير صالح. يرجى التحقق من إعدادات الخادم.',
    subscriptionError: 'تعذر تهيئة اشتراك الإشعارات. يرجى التأكد من أن المتصفح يسمح بالإشعارات.',
    history: 'عرض السجل',
  }

  return (
    <div className="notification-bell" ref={panelRef}>
      <button
        type="button"
        className="btn-icon btn-ghost"
        aria-label={labels.open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Icon name="Bell" size={20} />
        {unreadCount > 0 && <span className="notification-dot" />}
      </button>
      {open && (
        <div className="notification-menu">
          <div className="notification-menu-header">
            <div>
              <strong>{labels.title}</strong>
              <div className="notification-menu-subtitle">{panelLabel}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn btn-sm btn-ghost" onClick={markAllRead}>
                {labels.markAllRead}
              </button>
              <Link href={pathname?.startsWith('/provider') ? '/provider/notifications' : '/admin/notifications'} className="btn btn-sm btn-primary">
                {labels.history}
              </Link>
            </div>
          </div>

          {canPush && permission !== 'granted' && (
            <div className="notification-permission-banner">
              <div>{labels.enableBrowser}</div>
              <Button size="sm" onClick={requestPermission} disabled={loading}>
                {loading ? labels.saving : labels.enable}
              </Button>
            </div>
          )}

          {error && <div className="notification-error">{error}</div>}

          <div className="notification-list">
            {unreadItems.length === 0 ? (
              <div className="notification-empty">{labels.empty}</div>
            ) : (
              unreadItems.map((item) => {
                const data = item.data as Record<string, unknown> | null
                const url = data && typeof data.url === 'string' ? data.url : undefined
                const type = data && typeof data.type === 'string' ? data.type : undefined
                const editId = data && typeof data.editId === 'string' ? data.editId : undefined
                const defaultRoute = (() => {
                  if (!type) return undefined
                  switch (type) {
                    case 'customer_profile_edit_request':
                      return `/admin/customer-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'provider_profile_edit_request':
                      return `/admin/provider-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'customer_profile_edit_submitted':
                      return `/admin/customer-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'provider_profile_edit_submitted':
                      return `/admin/provider-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'address_change_request':
                      return `/admin/customer-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'address_change_submitted':
                      return `/admin/customer-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'customer_profile_edit_approved':
                    case 'customer_profile_edit_rejected':
                      return `/admin/customer-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'provider_profile_edit_approved':
                    case 'provider_profile_edit_rejected':
                      return `/admin/provider-profile-edits${editId ? `?editId=${encodeURIComponent(editId)}` : ''}`
                    case 'pending_account_approval':
                    case 'new_registration':
                      return '/admin/approvals'
                    default:
                      return undefined
                  }
                })()
                const href = url || defaultRoute
                const itemClassName = `notification-item ${item.isRead ? '' : 'notification-item-unread'}`

                const content = (
                  <>
                    <div className="notification-item-body">
                      <div className="notification-item-title">{item.titleAR || item.titleEN}</div>
                      <div className="notification-item-text">{item.bodyAR || item.bodyEN || ''}</div>
                    </div>
                    <div className="notification-item-time">
                      {formatRelativeTime(item.createdAt, document.documentElement.lang === 'ar' ? 'ar' : 'en')}
                    </div>
                  </>
                )

                if (href) {
                  return (
                    <button
                      key={item.id}
                      className={itemClassName}
                      type="button"
                      onClick={() => {
                        if (!item.isRead) updateReadState([item.id])
                        router.push(href)
                      }}
                    >
                      {content}
                    </button>
                  )
                }

                return (
                  <button
                    key={item.id}
                    className={itemClassName}
                    type="button"
                    onClick={() => {
                      if (!item.isRead) updateReadState([item.id])
                    }}
                  >
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
