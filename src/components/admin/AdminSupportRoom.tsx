"use client"
import { useEffect, useState, useRef, useCallback } from 'react';
import { showToast } from '@/components/ui/toast'
import '@/components/shop/support.css'
import { getErrorMessage } from '@/lib/errors'

type SupportMsg = {
  id: string
  content: string
  createdAt: string
  sender?: { id?: string; role?: string; nameEN?: string; nameAR?: string; mobile?: string }
  senderId?: string
}

export default function AdminSupportRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<SupportMsg[]>([])
  const [text, setText] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Deduplicated message setter
  const addMessages = useCallback((newMsgs: SupportMsg[]) => {
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const merged = [...prev]
      for (const m of newMsgs) {
        if (!existingIds.has(m.id)) {
          merged.push(m)
          existingIds.add(m.id)
        }
      }
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return merged
    })
  }, [])

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.json()).then((s: unknown) => {
      const user = (s as Record<string, unknown>)?.user as Record<string, unknown> | undefined
      setCurrentUserId(user ? (user.id as string | undefined) ?? null : null)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!roomId) return
    let mounted = true
    let es: EventSource | null = null
    let intervalId: ReturnType<typeof setInterval> | null = null

    async function fetchMessages() {
      if (!mounted || !roomId) return
      try {
        const res = await fetch(`/api/admin/support/${encodeURIComponent(roomId)}/messages`, { credentials: 'include' })
        const data = await res.json()
        if (mounted && res.ok && Array.isArray(data.messages)) {
          addMessages(data.messages)
        }
      } catch {
        // ignore fetch failures
      }
    }

    function connectSSE() {
      if (typeof window === 'undefined' || !window.EventSource) {
        void fetchMessages()
        return
      }

      es = new EventSource(`/api/admin/support/${roomId}/stream`, { withCredentials: true })
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data)
          if (!mounted) return
          if (data.type === 'initial' && Array.isArray(data.payload)) addMessages(data.payload as SupportMsg[])
          if (data.type === 'message') addMessages([data.payload as SupportMsg])
        } catch {
          // ignore malformed events
        }
      }
      es.onerror = () => {
        if (es) {
          es.close()
          es = null
        }
        if (mounted) setTimeout(() => {
          if (mounted) connectSSE()
        }, 15000)
      }
    }

    connectSSE()

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void fetchMessages()
    }
    const handleFocus = () => {
      void fetchMessages()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)

    return () => {
      mounted = false
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      if (intervalId) clearInterval(intervalId)
      if (es) es.close()
    }
  }, [roomId, addMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!text.trim()) return
    try {
      const res = await fetch(`/api/admin/support/${roomId}/messages`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ content: text }) })
      const data = await res.json()
      if (!res.ok) throw new Error((data as Record<string, unknown>)?.error ? String(((data as Record<string, unknown>)['error'])) : 'Failed')
      setText('')
      if ((data as Record<string, unknown>)['message']) addMessages([ (data as Record<string, unknown>)['message'] as SupportMsg ])
    } catch (err: unknown) { showToast(getErrorMessage(err), 'error') }
  }

  const getSenderLabel = (msg: SupportMsg) => {
    const sender = msg.sender
    if (!sender) return 'Admin'
    if (sender.id === currentUserId) return 'You'
    if (sender.role === 'ROOT_ADMIN' || sender.role === 'SUB_ADMIN') return 'Admin'
    return sender.nameEN || sender.nameAR || sender.mobile || 'Customer'
  }

  const isMe = (msg: SupportMsg) => msg.senderId === currentUserId || (msg.sender?.role === 'ROOT_ADMIN' || msg.sender?.role === 'SUB_ADMIN')

  return (
    <div className="support-chat-admin">
      <div className="messages" style={{
        flex: 1, overflowY: 'auto', padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-4)',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', padding: 'var(--space-8)' }}>
            No messages yet. Start the conversation.
          </div>
        )}
        {messages.map(m => {
          const me = isMe(m)
          return (
            <div key={m.id} className={`msg ${me ? 'me' : 'them'}`} style={{ alignSelf: me ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <div className="msg-content" style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: me ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
                background: me ? 'var(--gradient-primary)' : '#ffffff',
                color: me ? '#ffffff' : '#000000',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                wordBreak: 'break-word',
              }}>
                <div style={{
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--font-semibold)',
                  marginBottom: '2px',
                  color: me ? '#ffffff' : '#333333',
                  opacity: me ? 0.9 : 1,
                }}>{getSenderLabel(m)}</div>
                <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.5, color: me ? '#ffffff' : '#000000' }}>{m.content}</div>
              </div>
              <div style={{
                fontSize: 'var(--text-2xs)',
                color: '#666666',
                alignSelf: me ? 'flex-end' : 'flex-start',
                padding: '0 var(--space-2)',
              }}>{new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="composer">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          style={{
            flex: 1, padding: 'var(--space-3) var(--space-4)', borderRadius: 'var(--radius-lg)',
            border: '1px solid #ccc', background: '#ffffff', color: '#000000',
            fontSize: 'var(--text-sm)', outline: 'none',
          }}
        />
        <button type="button" onClick={send} className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
          Send
        </button>
      </div>
    </div>
  )
}
