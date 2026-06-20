import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production') return NextResponse.json({ error: 'not allowed' }, { status: 403 })
  const body = await request.json()
  const { providerId, providerMobile, adminMobile } = body || {}

  const { prisma } = await import('@/lib/prisma')
  if (providerId) {
    await prisma.auditLog.deleteMany({ where: { entityId: providerId } })
    const prov = await prisma.providerProfile.findUnique({ where: { id: providerId } })
    if (prov) {
      await prisma.notification.deleteMany({ where: { userId: prov.userId } })
      await prisma.providerProfile.delete({ where: { id: providerId } })
      await prisma.user.deleteMany({ where: { id: prov.userId } })
    }
  }

  if (providerMobile) {
    await prisma.notification.deleteMany({ where: { AND: [{ titleEN: { contains: 'UI' } }, { userId: { in: [] } }] } }).catch(()=>{})
    await prisma.user.deleteMany({ where: { mobile: providerMobile } })
  }

  if (adminMobile) {
    await prisma.user.deleteMany({ where: { mobile: adminMobile } })
  }

  return NextResponse.json({ ok: true })
}
