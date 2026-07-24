import { describe, it, expect, vi, beforeEach } from 'vitest'

const prismaMock = {
  address: {
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    updateMany: vi.fn(),
    count: vi.fn(),
    findFirst: vi.fn(),
  },
  customerProfileEdit: {
    create: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
  },
}

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('../src/lib/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('../src/lib/errors', () => ({ getErrorMessage: (err: unknown) => err instanceof Error ? err.message : String(err) }))
vi.mock('../src/lib/actions/notification.actions', () => ({ createNotification: vi.fn() }))

const { GET } = await import('../src/app/api/shop/profile/addresses/route')
const { POST } = await import('../src/app/api/shop/profile/addresses/route')
const { DELETE } = await import('../src/app/api/shop/profile/addresses/route')
const { getCurrentUser } = await import('../src/lib/auth')

const mockedGetCurrentUser = vi.mocked(getCurrentUser)

describe('address management routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER', status: 'APPROVED' } as any)
  })

  it('lists the current user addresses', async () => {
    prismaMock.address.findMany.mockResolvedValue([{ id: 'a1' }] as any)
    const res = await GET()
    expect(res.status).toBe(200)
    expect(prismaMock.address.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'user-1' } }))
  })

  it('submits a new address request for admin approval', async () => {
    prismaMock.customerProfileEdit.create.mockResolvedValue({ id: 'edit-1' } as any)
    prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as any)
    const req = new Request('http://localhost/api/shop/profile/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: { label: 'Home', fullName: 'Jane', mobile: '123', addressLine: 'Main', city: 'Cairo', isDefault: true } }),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(prismaMock.customerProfileEdit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        requestedBy: 'user-1',
        status: 'PENDING',
        changes: expect.objectContaining({ type: 'address_change', action: 'create' }),
      }),
    }))
    expect(prismaMock.address.create).not.toHaveBeenCalled()
  })

  it('submits a delete-address request for admin approval', async () => {
    prismaMock.customerProfileEdit.create.mockResolvedValue({ id: 'edit-2' } as any)
    prismaMock.user.findMany.mockResolvedValue([{ id: 'admin-1' }] as any)
    prismaMock.address.findFirst.mockResolvedValue({ id: 'a1', userId: 'user-1' } as any)
    const req = new Request('http://localhost/api/shop/profile/addresses?id=a1', {
      method: 'DELETE',
    }) as any

    const res = await DELETE(req)
    expect(res.status).toBe(200)
    expect(prismaMock.customerProfileEdit.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        requestedBy: 'user-1',
        status: 'PENDING',
        changes: expect.objectContaining({ type: 'address_change', action: 'delete', addressId: 'a1' }),
      }),
    }))
    expect(prismaMock.address.delete).not.toHaveBeenCalled()
  })
})
