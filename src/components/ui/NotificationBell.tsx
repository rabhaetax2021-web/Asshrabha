"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const prepareAudioContextRef = useRef<(() => Promise<void>) | null>(null)

  const prepareAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (!audioContextRef.current) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return
      audioContextRef.current = new AudioCtor()
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume().catch(() => null)
    }
  }, [])

  useEffect(() => {
    prepareAudioContextRef.current = prepareAudioContext
  }, [prepareAudioContext])

  const playNotificationSound = useCallback(async () => {
    if (typeof window === 'undefined') return

    const customSoundUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SOUND_URL?.trim()

    try {
      if (customSoundUrl) {
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio(customSoundUrl)
          audioElementRef.current.preload = 'auto'
          audioElementRef.current.volume = 1
        }
        await audioElementRef.current.play()
        return
      }

      await prepareAudioContextRef.current?.()
      const audioCtx = audioContextRef.current
      if (!audioCtx) return

      const gainNode = audioCtx.createGain()
      const filter = audioCtx.createBiquadFilter()
      const oscillator = audioCtx.createOscillator()
      const oscillator2 = audioCtx.createOscillator()

      const now = audioCtx.currentTime
      gainNode.gain.setValueAtTime(0.001, now)
      gainNode.gain.exponentialRampToValueAtTime(0.85, now + 0.03)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)

      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(880, now)
      filter.Q.setValueAtTime(8, now)

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(920, now)
      oscillator.frequency.exponentialRampToValueAtTime(520, now + 0.45)

      oscillator2.type = 'sawtooth'
      oscillator2.frequency.setValueAtTime(1320, now)
      oscillator2.detune.setValueAtTime(40, now)
      oscillator2.frequency.exponentialRampToValueAtTime(660, now + 0.45)

      oscillator.connect(filter)
      oscillator2.connect(filter)
      filter.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start(now)
      oscillator2.start(now)
      oscillator.stop(now + 0.8)
      oscillator2.stop(now + 0.8)
    } catch {
      // Ignore autoplay restrictions; a later user interaction will re-enable the sound.
    }
  }, [])

  const canPush = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window

  useEffect(() => {
    setPermission(typeof window !== 'undefined' ? Notification.permission : 'default')
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleUserInteraction = () => {
      void prepareAudioContextRef.current?.()
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
    let es: EventSource | null = null
    let intervalId: number | null = null

    const loadNotifications = async () => {
      try {
        setError(null)
        setLoading(true)
        const res = await fetch('/api/notifications', { cache: 'no-store' })
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

    function startPolling() {
      if (!active) return
      loadNotifications()
      intervalId = window.setInterval(loadNotifications, 20000)
    }

    function connectSSE() {
      if (typeof window === 'undefined' || !window.EventSource) {
        startPolling()
        return
      }

      loadNotifications()
      es = new EventSource('/api/notifications/stream')
      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          if (payload?.type === 'notification' && payload.payload) {
            const notification = payload.payload as NotificationItem
            setItems((prev) => [notification, ...prev].slice(0, 20))
            setUnreadCount((count) => count + (notification.isRead ? 0 : 1))
            if (!notification.isRead) {
              playNotificationSoundRef.current?.()
            }
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
        if (es) {
          es.close()
          es = null
        }
        if (intervalId === null) startPolling()
        if (active) {
          window.setTimeout(connectSSE, 5000)
        }
      }
    }

    connectSSE()

    return () => {
      active = false
      if (intervalId !== null) window.clearInterval(intervalId)
      if (es) es.close()
    }
  }, [])

  const playNotificationSoundRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    playNotificationSoundRef.current = () => {
      void playNotificationSound()
    }
  }, [playNotificationSound])

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
          if (!notification.isRead) {
            playNotificationSoundRef.current?.()
          }
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
      let publicKey = getVapidPublicKey()

      if (!publicKey) {
        const keyRes = await fetch('/api/notifications/vapid-key')
        if (keyRes.ok) {
          const keyData = await keyRes.json()
          publicKey = typeof keyData.publicKey === 'string' ? keyData.publicKey : undefined
        }
      }

      if (!subscription) {
        if (!publicKey) {
          setError(labels.subscriptionError)
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
    } catch {
      setError(labels.registerError)
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
    subscriptionError: 'تعذر تهيئة اشتراك الإشعارات. يرجى توفير NEXT_PUBLIC_WAPID_PUBLIC_KEY أو NEXT_PUBLIC_VAPID_PUBLIC_KEY.',
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
