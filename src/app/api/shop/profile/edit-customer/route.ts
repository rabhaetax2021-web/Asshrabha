import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { changes } = body
    if (!changes) return NextResponse.json({ error: 'missing fields' }, { status: 400 })
    // Apply changes immediately: update user fields and create/update address
    await prisma.$transaction(async (tx) => {
      if (changes.user) {
        const userData: Record<string, unknown> = {}
        if (typeof changes.user.nameEN !== 'undefined') userData.nameEN = changes.user.nameEN
        if (typeof changes.user.nameAR !== 'undefined') userData.nameAR = changes.user.nameAR
        if (typeof changes.user.mobile !== 'undefined') userData.mobile = changes.user.mobile
        if (typeof changes.user.email !== 'undefined') userData.email = changes.user.email
        if (typeof changes.user.avatar !== 'undefined') userData.avatar = changes.user.avatar

        // Only update if there are fields
        if (Object.keys(userData).length) {
          await tx.user.update({ where: { id: current.id }, data: userData as any })
        }
      }

      if (changes.address) {
        const a = changes.address as any
        // Resolve governorate name if locationId provided
        let cityName = a.city || ''
        if (a.locationId) {
          const loc = await tx.location.findUnique({ where: { id: a.locationId } })
          if (loc) cityName = loc.nameAR || loc.nameEN || cityName
        }

        // If this address should be default, clear other defaults
        if (a.isDefault) {
          await tx.address.updateMany({ where: { userId: current.id, isDefault: true }, data: { isDefault: false } })
        }

        const addrData: any = {
          userId: current.id,
          label: a.label || 'Home',
          fullName: a.fullName || '',
          mobile: a.mobile || current.mobile || '',
          addressLine: a.addressLine || '',
          city: cityName || '',
          locationId: a.locationId || null,
          area: a.area || null,
          landmark: a.landmark || null,
          isDefault: Boolean(a.isDefault),
        }

        await tx.address.create({ data: addrData })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('[api/shop/profile/edit-customer] error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
