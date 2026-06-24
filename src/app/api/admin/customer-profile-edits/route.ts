import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function GET(request: Request) {
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

export async function POST(request: Request) {
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
        await prisma.user.update({ where: { id: edit.userId }, data: changes.user || {} })
      } catch (e) { console.error('apply user changes error', e) }

      // Create address if provided in changes
      if (changes.address) {
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
              area: (addr?.area as string) || null,
              landmark: (addr?.landmark as string) || null,
              isDefault: Boolean(addr?.isDefault) || false,
            }
          })
        } catch (e) { console.error('create address error', e) }
      }

      await prisma.customerProfileEdit.update({ where: { id }, data: { status: 'APPROVED', adminNote: adminNote || null } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'reject') {
      await prisma.customerProfileEdit.update({ where: { id }, data: { status: 'REJECTED', adminNote: adminNote || null } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[api/admin/customer-profile-edits] POST error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
