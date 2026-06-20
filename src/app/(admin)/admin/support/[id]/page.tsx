import { prisma } from '@/lib/prisma'
import AdminSupportRoom from '@/components/admin/AdminSupportRoom'
import CloseTicketButton from '@/components/admin/CloseTicketButton'
import Link from 'next/link'

type PageProps = { params: Promise<{ id?: string | string[] }> | { id?: string | string[] } }

interface ChatRoom {
  id: string
  subject?: string | null
  participants: Array<{ user?: { id: string; nameEN?: string; nameAR?: string; mobile?: string; role?: string } }>
  messages: Array<{ createdAt: Date }>
  isClosed?: boolean
  createdAt: Date
}

export default async function Page({ params }: PageProps) {
  const p = await params
  let id = p?.id
  if (Array.isArray(id)) id = id[0]
  if (!id) {
    return <div className="container" style={{ padding: 'var(--space-8)' }}>Room not found (no id in URL)</div>
  }

  let room: ChatRoom | null = null
  try {
    room = await prisma.chatRoom.findUnique({
      where: { id },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    }) as unknown as ChatRoom | null

    if (!room) {
      // try decode
      try {
        const decoded = decodeURIComponent(id)
        if (decoded && decoded !== id) {
          room = await prisma.chatRoom.findUnique({ where: { id: decoded }, include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } }) as unknown as ChatRoom | null
          if (room) id = decoded
        }
      } catch {
        // ignore
      }
    }

    if (!room) {
      // fuzzy startsWith
      try {
        const byStarts = await prisma.chatRoom.findFirst({ where: { id: { startsWith: id } }, include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } }) as unknown as ChatRoom | null
        if (byStarts) {
          room = byStarts
          id = room.id
        }
      } catch {
        // ignore
      }
    }

    if (!room) {
      try {
        const byContains = await prisma.chatRoom.findFirst({ where: { id: { contains: id } }, include: { participants: { include: { user: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1 } } }) as unknown as ChatRoom | null
        if (byContains) {
          room = byContains
          id = room.id
        }
      } catch {
        // ignore
      }
    }
  } catch (err: unknown) {
    console.error('[admin/support/[id]] error during DB lookup', err)
    return <div className="container" style={{ padding: 'var(--space-8)' }}>Unable to load room</div>
  }

  if (!room) {
    console.error('[admin/support/[id]] Room not found for id:', id)
    return <div className="container" style={{ padding: 'var(--space-8)' }}>Room not found (id: {id})</div>
  }

  const nonAdminParticipants = room.participants.filter(p => p.user?.role !== 'ROOT_ADMIN' && p.user?.role !== 'SUB_ADMIN')
  const customer = nonAdminParticipants[0]?.user

  const roleLabel = customer?.role === 'PROVIDER' ? '🏪 Provider' : customer?.role === 'CUSTOMER' ? '🛒 Customer' : '👤 User'
  const statusBadge = room.isClosed
    ? { text: 'Closed', color: 'var(--error-dark)', bg: 'var(--error-light)' }
    : { text: 'Open', color: 'var(--success-dark)', bg: 'var(--success-light)' }

  return (
    <div className="container" style={{ padding: 'var(--space-4) var(--space-4) var(--space-8) var(--space-4)' }}>
      {/* Back link */}
      <Link href="/admin/support" style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', textDecoration: 'none', marginBottom: 'var(--space-4)', display: 'inline-block' }}>
        ← Back to Support Tickets
      </Link>

      {/* User Info Header */}
      <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
              {room.subject || 'Support Ticket'}
            </h2>
            {customer && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
                    {customer.nameEN || customer.nameAR || 'Unknown'}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                    {roleLabel}
                  </span>
                  <span style={{
                    fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)',
                    padding: '2px 8px', borderRadius: 'var(--radius-full)',
                    background: statusBadge.bg, color: statusBadge.color,
                  }}>
                    {statusBadge.text}
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <span>📱 {customer.mobile}</span>
                  <span>🆔 {customer.id}</span>
                  <span>📅 {new Date(room.createdAt).toLocaleString('en-GB')}</span>
                </div>
              </div>
            )}
          </div>
          <CloseTicketButton roomId={id} isClosed={!!room.isClosed} />
        </div>
      </div>

      <AdminSupportRoom roomId={id} />
    </div>
  )
}
