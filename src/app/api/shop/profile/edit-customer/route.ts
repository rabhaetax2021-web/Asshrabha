import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'
import { createNotification } from '@/lib/actions/notification.actions'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { changes } = body
    if (!changes) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const requestRecord = await prisma.customerProfileEdit.create({
      data: {
        userId: current.id,
        requestedBy: current.id,
        changes: changes as any,
        status: 'PENDING',
      },
    })

    const admins = await prisma.user.findMany({ where: { role: { in: ['ROOT_ADMIN', 'SUB_ADMIN'] } }, select: { id: true } })
    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin.id,
          'SYSTEM',
          'Customer profile edit requested',
          'تم طلب تعديل ملف العميل',
          {
            type: 'customer_profile_edit_request',
            editId: requestRecord.id,
            userId: current.id,
            bodyEN: `A customer submitted profile changes for review.`,
            bodyAR: `قدم عميل تعديلات على الملف الشخصي للمراجعة.`,
          }
        )
      )
    )

    await createNotification(
      current.id,
      'SYSTEM',
      'Profile edit submitted',
      'تم إرسال تعديل الملف الشخصي للمراجعة',
      {
        type: 'customer_profile_edit_submitted',
        editId: requestRecord.id,
        bodyEN: 'Your profile changes were submitted for admin approval.',
        bodyAR: 'تم إرسال تعديلات ملفك الشخصي للموافقة من الإدارة.',
      }
    )

    return NextResponse.json({ ok: true, id: requestRecord.id })
  } catch (err: unknown) {
    console.error('[api/shop/profile/edit-customer] error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
