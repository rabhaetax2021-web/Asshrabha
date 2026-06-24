import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function GET() {
  try {
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider) {
      return NextResponse.json({ error: 'provider not found' }, { status: 404 })
    }

    const zones = await prisma.deliveryZone.findMany({
      where: { providerId: provider.id },
      include: { location: true },
    })
    return NextResponse.json({ ok: true, zones })
  } catch (err: unknown) {
    console.error('[api/provider/delivery-zones] GET error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || current.role !== 'PROVIDER') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const provider = await prisma.providerProfile.findUnique({ where: { userId: current.id }, select: { id: true } })
    if (!provider) {
      return NextResponse.json({ error: 'provider not found' }, { status: 404 })
    }

    const body = await request.json()
    const { locationId, shippingPrice, isActive } = body
    if (!locationId) {
      return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    }

    const existing = await prisma.deliveryZone.findFirst({ where: { providerId: provider.id, locationId } })
    if (existing) {
      return NextResponse.json({ error: 'delivery area already exists' }, { status: 400 })
    }

    const zone = await prisma.deliveryZone.create({
      data: {
        providerId: provider.id,
        locationId,
        shippingPrice: Number(shippingPrice) || 0,
        isActive: Boolean(isActive),
      },
      include: { location: true },
    })

    return NextResponse.json({ ok: true, zone })
  } catch (err: unknown) {
    console.error('[api/provider/delivery-zones] POST error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
