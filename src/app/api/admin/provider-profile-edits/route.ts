import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const edits = await prisma.providerProfileEdit.findMany({ orderBy: { createdAt: 'desc' }, include: { provider: true, requester: true } })
    return NextResponse.json({ ok: true, edits })
  } catch (err: unknown) {
    console.error('[api/admin/provider-profile-edits] GET error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { id, action, adminNote } = body
    if (!id || !action) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const edit = await prisma.providerProfileEdit.findUnique({ where: { id } })
    if (!edit) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (action === 'approve') {
      // apply changes
      const changes = edit.changes as any
      // update provider profile
      try {
        await prisma.providerProfile.update({ where: { id: edit.providerId }, data: changes.providerProfile || {} })
      } catch (e) {
        console.error('apply providerProfile changes error', e)
      }
      // update user mobile if present
      if (changes.user && (changes.user as any).mobile) {
        try {
          const prov = await prisma.providerProfile.findUnique({ where: { id: edit.providerId }, select: { userId: true } })
          if (prov) await prisma.user.update({ where: { id: prov.userId }, data: { mobile: changes.user.mobile } })
        } catch (e) {
          console.error('apply user mobile change error', e)
        }
      }
      await prisma.providerProfileEdit.update({ where: { id }, data: { status: 'APPROVED', adminNote: adminNote || null } })
      return NextResponse.json({ ok: true })
    }

    if (action === 'reject') {
      await prisma.providerProfileEdit.update({ where: { id }, data: { status: 'REJECTED', adminNote: adminNote || null } })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  } catch (err: unknown) {
    console.error('[api/admin/provider-profile-edits] POST error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
