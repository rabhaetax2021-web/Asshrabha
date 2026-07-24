import { beforeEach, describe, expect, it, vi } from 'vitest'

const prismaMock = {
  order: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
}

vi.mock('../src/lib/prisma', () => ({ prisma: prismaMock }))
vi.mock('../src/lib/auth', () => ({ getCurrentUser: vi.fn() }))
vi.mock('../src/lib/actions/notification.actions', () => ({ createNotification: vi.fn() }))

const { POST } = await import('../src/app/api/shop/orders/[orderId]/cancel/route')
const { getCurrentUser } = await import('../src/lib/auth')

const mockedGetCurrentUser = vi.mocked(getCurrentUser)

describe('shop order cancellation route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetCurrentUser.mockResolvedValue({ id: 'user-1', role: 'CUSTOMER', status: 'APPROVED' } as any)
  })

  it('cancels an order owned by the current customer', async () => {
    prismaMock.order.findUnique.mockResolvedValue({ id: 'order-1', customerId: 'user-1', status: 'PENDING' } as any)
    prismaMock.order.update.mockResolvedValue({ id: 'order-1', status: 'CANCELLED' } as any)

    const req = new Request('http://localhost/api/shop/orders/order-1/cancel', { method: 'POST' }) as any
    const res = await POST(req, { params: Promise.resolve({ orderId: 'order-1' }) })

    expect(res.status).toBe(200)
    expect(prismaMock.order.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'order-1', customerId: 'user-1' },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    }))
  })
})
