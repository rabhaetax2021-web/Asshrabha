import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context
  try {
    const { params } = context
    const p = await params
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider) {
      return NextResponse.json({ error: 'provider not found' }, { status: 404 })
    }

    const deleted = await prisma.deliveryZone.deleteMany({ where: { id: p.id, providerId: provider.id } })
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[api/provider/delivery-zones/[id]] DELETE error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
