import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
import prisma from '@/lib/prisma'
import { approveProvider } from '@/lib/actions/admin.actions'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'not allowed in production' }, { status: 403 })
  }

  // create admin and provider, then approve provider using existing action
  const admin = await prisma.user.create({ data: { mobile: '999001', passwordHash: 'x', nameEN: 'SimAdmin', nameAR: 'Admin', role: 'ROOT_ADMIN', status: 'APPROVED', locale: 'en' } })
  const provUser = await prisma.user.create({ data: { mobile: '888001', passwordHash: 'x', nameEN: 'SimProv', nameAR: 'Prov', role: 'PROVIDER', status: 'PENDING', locale: 'en' } })
  const profile = await prisma.providerProfile.create({ data: { userId: provUser.id, shopNameEN: 'Sim Shop', shopNameAR: 'محل سيم', isVisible: false } })

  const before = await prisma.providerProfile.findUnique({ where: { id: profile.id } })

  // call approveProvider action
  await approveProvider(profile.id, admin.id, 'simulated')

  const after = await prisma.providerProfile.findUnique({ where: { id: profile.id } })

  // cleanup created records
  await prisma.auditLog.deleteMany({ where: { entityId: profile.id } })
  await prisma.notification.deleteMany({ where: { userId: provUser.id } })
  await prisma.providerProfile.deleteMany({ where: { id: profile.id } })
  await prisma.user.deleteMany({ where: { id: provUser.id } })
  await prisma.user.deleteMany({ where: { id: admin.id } })

  return NextResponse.json({ before, after })
}
