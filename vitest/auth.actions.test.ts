import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerAction } from '@/lib/actions/auth.actions'
import prisma from '@/lib/prisma'

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
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
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
