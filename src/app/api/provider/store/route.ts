import { NextResponse } from 'next/server'
import { updateStoreProfile } from '@/lib/actions/provider.actions'
import { updateStoreSchema } from '@/lib/validations/provider'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = updateStoreSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { providerId, ...data } = parsed.data
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER' || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const owner = await prisma.providerProfile.findUnique({ where: { id: providerId }, select: { userId: true } })
    if (!owner || owner.userId !== current.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const result = await updateStoreProfile(providerId, data)
    return NextResponse.json({ ok: true, result })
  } catch (err: any) {
    console.error('[api/provider/store] error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
