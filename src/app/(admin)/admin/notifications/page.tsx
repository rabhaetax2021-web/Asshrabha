import React from 'react'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { formatRelativeTime } from '@/lib/utils/helpers'

export default async function AdminNotificationsPage() {
  const current = await getCurrentUser()
  if (!current || !isAdmin(current.role as any)) {
    return <div>Forbidden</div>
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: current.id },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <section className="admin-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div>
          <h1>Notifications</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            Historical notification history for your admin account.
          </p>
        </div>
        <Link href="/admin" className="btn btn-ghost" style={{ whiteSpace: 'nowrap' }}>
          Back to dashboard
        </Link>
      </div>

      <div className="card">
        {notifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No notifications yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: 14,
                  borderRadius: 'var(--radius-md)',
                  background: notification.isRead ? 'var(--bg)' : 'var(--primary-50)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 'var(--text-base)' }}>
                      {notification.titleAR || notification.titleEN}
                    </strong>
                    {!notification.isRead && (
                      <span style={{ color: 'var(--primary)', fontSize: '0.8rem' }}>Unread</span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 8 }}>
                    {notification.bodyAR || notification.bodyEN || '—'}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {formatRelativeTime(notification.createdAt, current.locale === 'ar' ? 'ar' : 'en')}
                  </div>
                </div>
                <div style={{ minWidth: 120, textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {notification.type}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {(
                      typeof notification.createdAt === 'string'
                        ? notification.createdAt
                        : notification.createdAt.toISOString()
                    ).slice(0, 19).replace('T', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
