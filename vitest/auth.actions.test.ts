import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loginAction, registerAction, verifyOTPAction } from '@/lib/actions/auth.actions'
import prisma from '@/lib/prisma'
import { signIn } from '@/lib/auth'

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    wallet: {
      create: vi.fn(),
    },
    providerProfile: {
      create: vi.fn(),
    },
    address: {
      create: vi.fn(),
    },
    oTPCode: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    systemSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    location: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({
  __esModule: true,
  default: prismaMock,
  prisma: prismaMock,
}))

vi.mock('@/lib/auth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

describe('loginAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects the root admin to /admin', async () => {
    const compareMock = vi.mocked((await import('bcryptjs')).default.compare)
    compareMock.mockResolvedValue(true as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ passwordHash: 'hash' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({ id: 'admin-1', role: 'ROOT_ADMIN', status: 'APPROVED', forcePasswordReset: false } as never)
    vi.mocked(signIn).mockResolvedValue({ ok: true } as never)

    const result = await loginAction('01094056919', '2463')

    expect(result.success).toBe(true)
    expect(result.data?.redirectTo).toBe('/admin')
  })

  it('redirects provider and shop customers to their dashboard routes', async () => {
    const compareMock = vi.mocked((await import('bcryptjs')).default.compare)
    const findUniqueMock = vi.mocked(prisma.user.findUnique)
    compareMock.mockResolvedValue(true as never)

    let callCount = 0
    findUniqueMock.mockImplementation(async ({ where }: any) => {
      const isHashLookup = callCount % 2 === 0
      callCount += 1

      if (where.mobile === '01094056918') {
        return isHashLookup
          ? { passwordHash: 'hash' }
          : { id: 'provider-1', role: 'PROVIDER', status: 'APPROVED', forcePasswordReset: false }
      }

      if (where.mobile === '01094056916') {
        return isHashLookup
          ? { passwordHash: 'hash' }
          : { id: 'customer-1', role: 'CUSTOMER', customerType: 'SHOP', status: 'APPROVED', forcePasswordReset: false }
      }

      return null as never
    })
    vi.mocked(signIn).mockResolvedValue({ ok: true } as never)

    const providerCase = await loginAction('01094056918', '2463')
    expect(providerCase.success).toBe(true)
    expect(providerCase.data?.redirectTo).toBe('/provider')

    const shopCustomerCase = await loginAction('01094056916', '2463')
    expect(shopCustomerCase.success).toBe(true)
    expect(shopCustomerCase.data?.redirectTo).toBe('/shop')
  })
})

describe('verifyOTPAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates an admin notification when a customer account needs approval', async () => {
    vi.mocked(prisma.oTPCode.findFirst).mockResolvedValue({ id: 'otp-1', userId: 'customer-1' } as never)
    vi.mocked(prisma.oTPCode.update).mockResolvedValue({ id: 'otp-1' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'CUSTOMER' } as never)
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({ value: 'true' } as never)
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'admin-1' }] as never)
    vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma))

    const result = await verifyOTPAction('customer-1', '123456')

    expect(result.success).toBe(true)
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'admin-1',
          type: 'SYSTEM',
          data: expect.objectContaining({
            type: 'pending_account_approval',
            userId: 'customer-1',
          }),
        }),
      ],
    })
  })

  it('creates an admin notification when a customer account is auto-approved', async () => {
    vi.mocked(prisma.oTPCode.findFirst).mockResolvedValue({ id: 'otp-1', userId: 'customer-1' } as never)
    vi.mocked(prisma.oTPCode.update).mockResolvedValue({ id: 'otp-1' } as never)
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: 'CUSTOMER' } as never)
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue({ value: 'false' } as never)
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: 'admin-1' }] as never)
    vi.mocked(prisma.notification.createMany).mockResolvedValue({ count: 1 } as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prisma))

    const result = await verifyOTPAction('customer-1', '123456')

    expect(result.success).toBe(true)
    expect(prisma.notification.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'admin-1',
          titleEN: 'New customer account',
          bodyEN: 'A new customer account was created',
        }),
      ],
    })
  })
})

describe('registerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stores the uploaded logo and cover for providers during registration', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.systemSetting.findMany).mockResolvedValue([
      { key: 'allowProviderRegistration', value: 'true' },
      { key: 'allowCustomerRegistration', value: 'true' },
    ] as never)
    vi.mocked(prisma.user.create).mockResolvedValue({ id: 'user-1' } as never)
    vi.mocked(prisma.wallet.create).mockResolvedValue({ id: 'wallet-1' } as never)
    vi.mocked(prisma.providerProfile.create).mockResolvedValue({ id: 'profile-1' } as never)
    vi.mocked(prisma.oTPCode.create).mockResolvedValue({ id: 'otp-1' } as never)
    vi.mocked(prisma.systemSetting.findUnique).mockResolvedValue(null as never)
    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => callback(prismaMock))

    const result = await registerAction({
      mobile: '01000000000',
      password: 'Password123',
      nameAR: 'اسم',
      nameEN: 'Name',
      role: 'PROVIDER',
      locationAddress: 'Address',
      avatar: 'https://cdn.example.com/profile.png',
      logo: 'https://cdn.example.com/profile.png',
      banner: 'https://cdn.example.com/cover.png',
    })

    expect(result.success).toBe(true)
    expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ avatar: 'https://cdn.example.com/profile.png' }),
    }))
    expect(prisma.providerProfile.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        logo: 'https://cdn.example.com/profile.png',
        banner: 'https://cdn.example.com/cover.png',
      }),
    }))
  })
})
