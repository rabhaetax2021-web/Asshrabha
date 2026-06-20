import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

vi.mock('../src/lib/prisma', () => {
  return {
    prisma: {
      providerProfile: { update: vi.fn() },
      user: { update: vi.fn() },
      notification: { create: vi.fn() },
      auditLog: { create: vi.fn() },
    },
  }
})

import { prisma } from '../src/lib/prisma'
import { approveProvider } from '../src/lib/actions/admin.actions'

describe('approveProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates provider visibility, user status, creates notification and audit log', async () => {
    const fakeProvider = { id: 'prov1', userId: 'user1', isVisible: false }
    ;(prisma.providerProfile.update as any).mockResolvedValue({ ...fakeProvider, isVisible: true })
    ;(prisma.user.update as any).mockResolvedValue({ id: 'user1', status: 'APPROVED' })
    ;(prisma.notification.create as any).mockResolvedValue({ id: 'n1' })
    ;(prisma.auditLog.create as any).mockResolvedValue({ id: 'a1' })

    const res = await approveProvider('prov1', 'admin1', 'note')

    expect(prisma.providerProfile.update).toHaveBeenCalledWith({ where: { id: 'prov1' }, data: { isVisible: true }, include: { user: true } })
    expect(prisma.user.update).toHaveBeenCalledWith({ where: { id: fakeProvider.userId }, data: { status: 'APPROVED' } })
    expect(prisma.notification.create).toHaveBeenCalled()
    expect(prisma.auditLog.create).toHaveBeenCalled()
    expect(res).toHaveProperty('id', 'prov1')
  })
})
