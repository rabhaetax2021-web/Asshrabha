import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { getErrorMessage } from '@/lib/errors'

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const id = params.id
    await prisma.catalogProduct.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const id = params.id
    const body = await request.json()
    const updated = await prisma.catalogProduct.update({ where: { id }, data: body })
    return NextResponse.json({ ok: true, product: updated })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
