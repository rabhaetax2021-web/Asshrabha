import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const zones = await prisma.deliveryZone.findMany({ orderBy: { id: 'asc' }, include: { provider: true, location: true } })
    return NextResponse.json({ ok: true, zones })
  } catch (err: any) {
    console.error('[api/admin/delivery-zones] GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { providerId, locationId, isActive, shippingPrice } = body
    if (!providerId || !locationId) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const zone = await prisma.deliveryZone.create({ data: { providerId, locationId, isActive: !!isActive, shippingPrice: Number(shippingPrice) || 0 } })
    return NextResponse.json({ ok: true, zone })
  } catch (err: any) {
    console.error('[api/admin/delivery-zones] POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
