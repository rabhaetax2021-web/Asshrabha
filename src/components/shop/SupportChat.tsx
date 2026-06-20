"use client"
import React, { useEffect, useState, useRef, useCallback } from 'react'
import { showToast } from '@/components/ui/toast'
import './support.css'

export default function SupportChat() {
  const [roomId, setRoomId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [text, setText] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Deduplicated message setter
  const addMessages = useCallback((newMsgs: any[]) => {
    setMessages(prev => {
      const existingIds = new Set(prev.map(m => m.id))
      const merged = [...prev]
      for (const m of newMsgs) {
        if (!existingIds.has(m.id)) {
          merged.push(m)
          existingIds.add(m.id)
        }
      }
      // Sort by createdAt to keep order
      merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      return merged
    })
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const s = await fetch('/api/auth/session').then(r => r.json()).catch(() => ({}))
        if (mounted) setCurrentUserId(s?.user?.id || null)

        const res = await fetch('/api/shop/support/start', { method: 'POST' })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || 'Failed')
        if (!data?.id) {
          showToast('Failed to start support chat', 'error')
          return
        }
        if (mounted) setRoomId(String(data.id))
      } catch (e: any) {
        showToast(e?.message || String(e), 'error')
      }
    })()
    return () => { mounted = false }
  }, [])

  // Polling fallback for live chat (reliable across browsers)
  useEffect(() => {
    if (!roomId) return
    let mounted = true

    async function fetchMessages() {
      if (!mounted || !roomId) return
      try {
        const res = await fetch(`/api/shop/support/${encodeURIComponent(roomId)}/messages`, { credentials: 'include' })
        const data = await res.json()
        if (mounted && res.ok && Array.isArray(data.messages)) {
          addMessages(data.messages)
        }
      } catch (e) {}
    }

    // Fetch immediately on mount
    fetchMessages()

    // Poll every 2 seconds
    pollRef.current = setInterval(fetchMessages, 2000)

    return () => {
      mounted = false
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [roomId, addMessages])

  // SSE for faster updates (optional enhancement)
  useEffect(() => {
    if (!roomId) return
    let mounted = true
    const es = new EventSource(`/api/shop/support/${roomId}/stream`, { withCredentials: true })
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (!mounted) return
        if (data.type === 'initial') addMessages(data.payload || [])
        if (data.type === 'message') addMessages([data.payload])
      } catch (e) {}
    }
    es.onerror = () => { /* keep open, browser will retry */ }
    return () => { mounted = false; es.close() }
  }, [roomId, addMessages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!roomId) { showToast('No support room available', 'error'); return }
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`/api/shop/support/${encodeURIComponent(roomId)}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed')
      setText('')
      if (data.message) addMessages([data.message])
    } catch (e: any) { showToast(e?.message || String(e), 'error') }
    finally { setLoading(false) }
  }

  const getSenderLabel = (msg: any) => {
    const sender = msg.sender
    if (!sender) return 'Admin'
    if (sender.id === currentUserId) return 'You'
    if (sender.role === 'ROOT_ADMIN' || sender.role === 'SUB_ADMIN') return 'Admin'
    return sender.nameEN || sender.nameAR || sender.mobile || 'Customer'
  }

  const isMe = (msg: any) => msg.senderId === currentUserId

  return (
    <div className="support-chat">
      <div className="messages" style={{
        flex: 1, overflowY: 'auto', padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        background: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-4)',
      }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#666', padding: 'var(--space-8)' }}>
            No messages yet. Start the conversation with our support team.
          </div>
        )}
        {messages.map(m => {
          const me = isMe(m)
          return (
            <div key={m.id} className={`msg ${me ? 'me' : 'them'}`} style={{ alignSelf: me ? 'flex-end' : 'flex-start' }}>
              <div className="msg-content" style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: me ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
                background: me ? 'var(--gradient-primary)' : '#ffffff',
                color: me ? '#ffffff' : '#000000',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                maxWidth: '80%',
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
                padding: '0 var(--space-2)',
                alignSelf: me ? 'flex-end' : 'flex-start',
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
        <button type="button" onClick={send} disabled={loading} className="btn btn-primary" style={{ padding: 'var(--space-3) var(--space-6)', borderRadius: 'var(--radius-lg)' }}>
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}
