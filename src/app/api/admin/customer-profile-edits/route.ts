import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const edits = await prisma.customerProfileEdit.findMany({ orderBy: { createdAt: 'desc' }, include: { user: true, requester: true } })
    return NextResponse.json({ ok: true, edits })
  } catch (err: any) {
    console.error('[api/admin/customer-profile-edits] GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, action, adminNote } = body
    if (!id || !action) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const edit = await prisma.customerProfileEdit.findUnique({ where: { id } })
    if (!edit) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (action === 'approve') {
      const changes = edit.changes as any
      try {
        await prisma.user.update({ where: { id: edit.userId }, data: changes.user || {} })
      } catch (e) { console.error('apply user changes error', e) }

      // Create address if provided in changes
      if (changes.address) {
        try {
          const addr = changes.address
          await prisma.address.create({
            data: {
              userId: edit.userId,
              label: addr.label || 'Home',
              fullName: addr.fullName || '',
              mobile: addr.mobile || '',
              addressLine: addr.addressLine || '',
              city: addr.city || '',
              area: addr.area || null,
              landmark: addr.landmark || null,
              isDefault: addr.isDefault || false,
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
  } catch (err: any) {
    console.error('[api/admin/customer-profile-edits] POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
