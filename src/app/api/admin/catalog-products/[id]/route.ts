import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { getErrorMessage } from '@/lib/errors'
import { catalogProductUpdateSchema } from '@/lib/validations/catalog'

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const id = (await params).id

    // Soft-delete: archive the catalog product and suspend all provider listings
    await prisma.$transaction([
      prisma.catalogProduct.update({
        where: { id },
        data: { status: 'ARCHIVED' },
      }),
      prisma.providerProduct.updateMany({
        where: { catalogProductId: id },
        data: { status: 'SUSPENDED' },
      }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { params } = context
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    const id = (await params).id
    const body = await request.json() as Record<string, unknown>
    const parsed = catalogProductUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message || 'invalid payload' }, { status: 400 })
    }

    const updated = await prisma.catalogProduct.update({ where: { id }, data: parsed.data as any })
    return NextResponse.json({ ok: true, product: updated })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
