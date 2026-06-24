import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function GET() {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    const requests = await (prisma as any).depositRequest.findMany({ orderBy: { createdAt: 'desc' }, include: { wallet: { include: { user: true } } }, take: 200 })
    return NextResponse.json({ ok: true, requests })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
