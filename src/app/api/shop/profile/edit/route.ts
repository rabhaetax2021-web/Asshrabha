import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER' || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { providerId, changes } = body
    if (!providerId || !changes) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    // ensure provider ownership
    const owner = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { userId: true } })
    if (!owner || owner.userId !== current.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const req = await prisma.providerProfileEdit.create({ data: {
      providerId,
      requestedBy: current.id,
      changes: changes as any,
      status: 'PENDING',
    }})

    return NextResponse.json({ ok: true, id: req.id })
  } catch (err: unknown) {
    console.error('[api/shop/profile/edit] error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
