import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    providerProfile: {
      count: vi.fn(),
    },
  },
}))

import { prisma } from '../src/lib/prisma'
import { getPendingAccountApprovalsCount } from '../src/lib/actions/admin.actions'

describe('pending account approvals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('counts pending provider accounts for the admin dashboard', async () => {
    ;(prisma.providerProfile.count as any).mockResolvedValue(3)

    const count = await getPendingAccountApprovalsCount()

    expect(count).toBe(3)
    expect(prisma.providerProfile.count).toHaveBeenCalledWith({
      where: {
        user: {
          role: 'PROVIDER',
          status: 'PENDING',
        },
      },
    })
  })
})
