import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'
import { createNotification } from '@/lib/actions/notification.actions'

export async function GET() {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const addresses = await prisma.address.findMany({
      where: { userId: current.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ ok: true, addresses })
  } catch (err: unknown) {
    console.error('[api/shop/profile/addresses] GET error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { address } = body as { address?: Record<string, unknown> }
    if (!address) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const requestRecord = await prisma.customerProfileEdit.create({
      data: {
        userId: current.id,
        requestedBy: current.id,
        changes: {
          type: 'address_change',
          action: 'create',
          address: {
            label: String(address.label || 'Home'),
            fullName: String(address.fullName || ''),
            mobile: String(address.mobile || current.mobile || ''),
            addressLine: String(address.addressLine || ''),
            city: String(address.city || ''),
            locationId: typeof address.locationId === 'string' ? address.locationId : null,
            area: typeof address.area === 'string' ? address.area : null,
            landmark: typeof address.landmark === 'string' ? address.landmark : null,
            isDefault: Boolean(address.isDefault),
          },
        },
        status: 'PENDING',
      },
    })

    const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          'SYSTEM',
          'Address change requested',
          'تم طلب تعديل عنوان للمراجعة',
          {
            type: 'address_change_request',
            editId: requestRecord.id,
            userId: current.id,
            bodyEN: 'A customer submitted an address change for review.',
            bodyAR: 'قدم عميل طلب تعديل عنوان للمراجعة.',
          }
        )
      )
    )

    await createNotification(
      current.id,
      'SYSTEM',
      'Address change submitted',
      'تم إرسال طلب تعديل العنوان للمراجعة',
      {
        type: 'address_change_submitted',
        editId: requestRecord.id,
        bodyEN: 'Your address change request was submitted for admin approval.',
        bodyAR: 'تم إرسال طلب تعديل عنوانك للموافقة من الإدارة.',
      }
    )

    return NextResponse.json({ ok: true, pending: true, id: requestRecord.id })
  } catch (err: unknown) {
    console.error('[api/shop/profile/addresses] POST error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const target = await prisma.address.findFirst({ where: { id, userId: current.id } })
    if (!target) return NextResponse.json({ error: 'not found' }, { status: 404 })

    const requestRecord = await prisma.customerProfileEdit.create({
      data: {
        userId: current.id,
        requestedBy: current.id,
        changes: {
          type: 'address_change',
          action: 'delete',
          addressId: id,
        },
        status: 'PENDING',
      },
    })

    const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          'SYSTEM',
          'Address deletion requested',
          'تم طلب حذف عنوان للمراجعة',
          {
            type: 'address_change_request',
            editId: requestRecord.id,
            userId: current.id,
            bodyEN: 'A customer submitted an address deletion request for review.',
            bodyAR: 'قدم عميل طلب حذف عنوان للمراجعة.',
          }
        )
      )
    )

    await createNotification(
      current.id,
      'SYSTEM',
      'Address deletion submitted',
      'تم إرسال طلب حذف العنوان للمراجعة',
      {
        type: 'address_change_submitted',
        editId: requestRecord.id,
        bodyEN: 'Your address deletion request was submitted for admin approval.',
        bodyAR: 'تم إرسال طلب حذف عنوانك للموافقة من الإدارة.',
      }
    )

    return NextResponse.json({ ok: true, pending: true, id: requestRecord.id })
  } catch (err: unknown) {
    console.error('[api/shop/profile/addresses] DELETE error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
