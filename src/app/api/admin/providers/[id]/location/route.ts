import { NextResponse, NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export const runtime = 'nodejs'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const p = await context.params
    const id = p.id
    const body = await request.json()
    const lat = Number(body?.lat)
    const lng = Number(body?.lng)
    if (!id || Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const updated = await prisma.providerProfile.update({ where: { id }, data: { locationLat: lat, locationLng: lng } })

    return NextResponse.json({ ok: true, id: updated.id })
  } catch (err: unknown) {
    console.error('[api/admin/providers/[id]/location] error', getErrorMessage(err))
    return NextResponse.json({ ok: false, error: getErrorMessage(err) }, { status: 500 })
  }
}
