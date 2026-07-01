import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createProviderProduct, getFirstProvider, updateStoreProfile } from '@/lib/actions/provider.actions'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/actions/notification.actions'
import { getCurrentUser } from '@/lib/auth'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    providerProduct: {
      findFirst: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    providerProfile: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    providerProfileEdit: {
      create: vi.fn(),
    },
    providerProductOption: {
      createMany: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}))

vi.mock('@/lib/actions/notification.actions', () => ({
  createNotification: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}))

describe('provider approval notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('submits a new product listing for admin approval and notifies the provider', async () => {
    vi.mocked(prisma.providerProduct.findFirst).mockResolvedValue(null as never)
    vi.mocked(prisma.providerProfile.findUnique).mockResolvedValue({ id: 'provider-1', userId: 'user-1', defaultWholesaleUnit: 'BOX' } as never)
    vi.mocked(prisma.providerProduct.create).mockResolvedValue({ id: 'product-1', status: 'PENDING_APPROVAL' } as never)
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'admin-1' }] as never)
    vi.mocked(createNotification).mockResolvedValue({ id: 'note-1' } as never)

    await createProviderProduct('provider-1', 'catalog-1', 30, 5, 25, 35, [], 'BOX')

    expect(createNotification).toHaveBeenCalledWith(
      'admin-1',
      'PRODUCT_SUBMISSION',
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ bodyEN: expect.any(String), bodyAR: expect.any(String) })
    )
    expect(createNotification).toHaveBeenCalledWith(
      'user-1',
      'PRODUCT_SUBMISSION',
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ bodyEN: expect.any(String), bodyAR: expect.any(String) })
    )
  })

  it('creates a pending profile edit request for admin review', async () => {
    vi.mocked(prisma.providerProfile.findUnique).mockResolvedValue({ id: 'provider-1', userId: 'user-1', shopNameEN: 'Old Shop', shopNameAR: 'متجر قديم', descriptionEN: '', descriptionAR: '', logo: null, banner: null, locationPhoto: null, defaultWholesaleUnit: null } as never)
    vi.mocked(prisma.providerProfileEdit.create).mockResolvedValue({ id: 'edit-1' } as never)
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'admin-1' }] as never)
    vi.mocked(createNotification).mockResolvedValue({ id: 'note-2' } as never)

    const result = await updateStoreProfile('provider-1', { shopNameEN: 'New Shop', shopNameAR: 'متجر جديد' })

    expect(prisma.providerProfile.findUnique).toHaveBeenCalled()
    expect(prisma.providerProfileEdit.create).toHaveBeenCalled()
    expect(result.status).toBe('pending-review')
  })

  it('uses the logged-in provider profile when loading products', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-2', role: 'PROVIDER' } as never)
    vi.mocked(prisma.providerProfile.findFirst).mockResolvedValue({ id: 'provider-2', userId: 'user-2' } as never)

    const provider = await getFirstProvider()

    expect(provider?.id).toBe('provider-2')
    expect(prisma.providerProfile.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-2' },
      include: { user: true },
    }))
  })
})
