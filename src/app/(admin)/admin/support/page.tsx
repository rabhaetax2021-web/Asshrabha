import React from 'react'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function AdminSupportPage() {
  const rooms = await prisma.chatRoom.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 100,
    include: {
      participants: {
        include: { user: true }
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { sender: { select: { nameEN: true, nameAR: true, mobile: true } } }
      }
    }
  })

  return (
    <section className="admin-support container">
      <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-6)', color: 'var(--text-primary)' }}>
        Support Chats
      </h1>

      {rooms.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
          <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>💬</div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--font-bold)', marginBottom: 'var(--space-2)' }}>No support tickets yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Tickets will appear here when customers or providers start a chat.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {rooms.map(r => {
          const nonAdminParticipants = r.participants.filter(p => p.user?.role !== 'ROOT_ADMIN' && p.user?.role !== 'SUB_ADMIN')
          const customer = nonAdminParticipants[0]?.user
          const lastMsg = r.messages[0]
          const statusBadge = r.isClosed
            ? { text: 'Closed', color: 'var(--error-dark)', bg: 'var(--error-light)' }
            : { text: 'Open', color: 'var(--success-dark)', bg: 'var(--success-light)' }

          const roleLabel = customer?.role === 'PROVIDER' ? '🏪 Provider' : customer?.role === 'CUSTOMER' ? '🛒 Customer' : '👤 User'

          return (
            <div key={r.id} className="card" style={{
              padding: 'var(--space-4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
              opacity: r.isClosed ? 0.7 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)', flexWrap: 'wrap' }}>
                    <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', margin: 0 }}>
                      {r.subject || 'Support Ticket'}
                    </h3>
                    <span style={{
                      fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                      padding: '2px var(--space-2)', borderRadius: 'var(--radius-full)',
                      background: statusBadge.bg, color: statusBadge.color,
                    }}>
                      {statusBadge.text}
                    </span>
                  </div>

                  {customer && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)', fontWeight: 'var(--font-semibold)' }}>
                          {customer.nameEN || customer.nameAR || 'Unknown'}
                        </span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                          {roleLabel}
                        </span>
                      </div>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        📱 {customer.mobile} · ID: {customer.id.slice(0, 8)}...
                      </span>
                    </div>
                  )}

                  {lastMsg && (
                    <div style={{ marginTop: 'var(--space-2)', padding: 'var(--space-2)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <strong>{lastMsg.sender?.nameEN || lastMsg.sender?.nameAR || lastMsg.sender?.mobile || 'Admin'}:</strong> {lastMsg.content}
                      </p>
                      <p style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                        {new Date(lastMsg.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', flexShrink: 0 }}>
                  <Link href={`/admin/support/${r.id}`} className="btn btn-primary" style={{ fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>
                    Open Chat
                  </Link>
                  <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
                    {new Date(r.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
