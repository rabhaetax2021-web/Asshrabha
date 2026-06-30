import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = {
  customerProfileEdit: {
    create: vi.fn(),
  },
  user: {
    update: vi.fn(),
    findMany: vi.fn(),
  },
  address: {
    create: vi.fn(),
  },
}

vi.mock('@/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('@/lib/errors', () => ({ getErrorMessage: (err: unknown) => err instanceof Error ? err.message : String(err) }))
vi.mock('@/lib/actions/notification.actions', () => ({ createNotification: vi.fn() }))

const { POST } = await import('@/app/api/shop/profile/edit-customer/route')
const { getCurrentUser } = await import('@/lib/auth')

const mockedGetCurrentUser = vi.mocked(getCurrentUser)

describe('customer profile edit route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER', status: 'APPROVED' } as any)
    prismaMock.customerProfileEdit.create.mockResolvedValue({ id: 'edit-1' } as any)
    prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as any)
  })

  it('creates a pending approval request instead of applying changes immediately', async () => {
    const req = new Request('http://localhost/api/shop/profile/edit-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changes: { user: { nameEN: 'New Name' } } }),
    }) as any

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(prismaMock.customerProfileEdit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        requestedBy: 'user-1',
        status: 'PENDING',
      }),
    }))
    expect(prismaMock.user.update).not.toHaveBeenCalled()
  })
})
