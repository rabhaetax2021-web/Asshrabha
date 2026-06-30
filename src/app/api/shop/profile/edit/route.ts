import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'
import { createNotification } from '@/lib/actions/notification.actions'

export async function POST(request: NextRequest) {
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

    const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          'SYSTEM',
          'Provider profile edit requested',
          'تم طلب تعديل الملف الشخصي للمزود',
          {
            type: 'provider_profile_edit_request',
            editId: req.id,
            providerId,
            bodyEN: 'A provider submitted profile changes for admin review.',
            bodyAR: 'قدم مزود تعديلات على ملفه الشخصي للمراجعة من الإدارة.',
          }
        )
      )
    )

    await createNotification(
      current.id,
      'SYSTEM',
      'Profile edit submitted',
      'تم إرسال طلب تعديل الملف الشخصي للمراجعة',
      {
        type: 'provider_profile_edit_submitted',
        editId: req.id,
        bodyEN: 'Your profile changes were submitted for admin approval.',
        bodyAR: 'تم إرسال تعديلات ملفك الشخصي للموافقة من الإدارة.',
      }
    )

    return NextResponse.json({ ok: true, id: req.id })
  } catch (err: unknown) {
    console.error('[api/shop/profile/edit] error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
