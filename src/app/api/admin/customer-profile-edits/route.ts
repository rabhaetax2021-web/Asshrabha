import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'
import { createNotification } from '@/lib/actions/notification.actions'

export async function GET(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const edits = await prisma.customerProfileEdit.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true, requester: true } })
    return NextResponse.json({ ok: true, edits })
  } catch (err: unknown) {
    console.error('[api/admin/customer-profile-edits] GET error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json() as Record<string, unknown>
    const { id, action, adminNote } = body as { id?: string; action?: string; adminNote?: string }
    if (!id || !action) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const edit = await prisma.customerProfileEdit.findUnique({ where: { id } })
    if (!edit) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (action === 'approve') {
      const changes = edit.changes as Record<string, unknown>
      try {
        if (changes.user) {
          const userData: Record<string, unknown> = {}
          const userChanges = changes.user as Record<string, unknown>
          if (typeof userChanges.nameEN !== 'undefined') userData.nameEN = userChanges.nameEN
          if (typeof userChanges.nameAR !== 'undefined') userData.nameAR = userChanges.nameAR
          if (typeof userChanges.mobile !== 'undefined') userData.mobile = userChanges.mobile
          if (typeof userChanges.email !== 'undefined') userData.email = userChanges.email
          if (typeof userChanges.avatar !== 'undefined') userData.avatar = userChanges.avatar
          if (Object.keys(userData).length) {
            await prisma.user.update({ where: { id: edit.userId }, data: userData as any })
          }
        }
      } catch (e) { console.error('apply user changes error', e) }

      if (changes.type === 'address_change') {
        try {
          if (changes.action === 'create') {
            const addr = changes.address as Record<string, unknown> | undefined
            await prisma.address.create({
              data: {
                userId: edit.userId,
                label: (addr?.label as string) || 'Home',
                fullName: (addr?.fullName as string) || '',
                mobile: (addr?.mobile as string) || '',
                addressLine: (addr?.addressLine as string) || '',
                city: (addr?.city as string) || '',
                locationId: (addr?.locationId as string) || null,
                area: (addr?.area as string) || null,
                landmark: (addr?.landmark as string) || null,
                isDefault: Boolean(addr?.isDefault) || false,
              }
            })
          } else if (changes.action === 'delete') {
            const addressId = changes.addressId as string | undefined
            if (addressId) {
              await prisma.address.deleteMany({ where: { id: addressId, userId: edit.userId } })
            }
          } else if (changes.action === 'set_default') {
            const addressId = changes.addressId as string | undefined
            if (addressId) {
              await prisma.address.updateMany({ where: { userId: edit.userId }, data: { isDefault: false } })
              await prisma.address.updateMany({ where: { id: addressId, userId: edit.userId }, data: { isDefault: true } })
            }
          }
        } catch (e) { console.error('apply address change error', e) }
      } else if (changes.address) {
        try {
          const addr = changes.address as Record<string, unknown> | undefined
          await prisma.address.create({
            data: {
              userId: edit.userId,
              label: (addr?.label as string) || 'Home',
              fullName: (addr?.fullName as string) || '',
              mobile: (addr?.mobile as string) || '',
              addressLine: (addr?.addressLine as string) || '',
              city: (addr?.city as string) || '',
              locationId: (addr?.locationId as string) || null,
              area: (addr?.area as string) || null,
              landmark: (addr?.landmark as string) || null,
              isDefault: Boolean(addr?.isDefault) || false,
            }
          })
        } catch (e) { console.error('create address error', e) }
      }

      await prisma.customerProfileEdit.update({ where: { id }, data: { status: 'APPROVED', adminNote: adminNote || null } })
      await createNotification(
        edit.userId,
        'SYSTEM',
        'Profile edit approved',
        'تمت الموافقة على تعديل الملف الشخصي',
        {
          type: 'customer_profile_edit_approved',
          editId: edit.id,
          bodyEN: `Your profile changes were approved by admin.${adminNote ? ` Note: ${adminNote}` : ''}`,
          bodyAR: `تمت الموافقة على تعديلات ملفك الشخصي من الإدارة.${adminNote ? ` ملاحظة: ${adminNote}` : ''}`,
        }
      )
      return NextResponse.json({ ok: true })
    }

    if (action === 'reject') {
      await prisma.customerProfileEdit.update({ where: { id }, data: { status: 'REJECTED', adminNote: adminNote || null } })
      await createNotification(
        edit.userId,
        'SYSTEM',
        'Profile edit rejected',
        'تم رفض تعديل الملف الشخصي',
        {
          type: 'customer_profile_edit_rejected',
          editId: edit.id,
          bodyEN: `Your profile changes were rejected by admin.${adminNote ? ` Note: ${adminNote}` : ''}`,
          bodyAR: `تم رفض تعديلات ملفك الشخصي من الإدارة.${adminNote ? ` ملاحظة: ${adminNote}` : ''}`,
        }
      )
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[api/admin/customer-profile-edits] POST error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
