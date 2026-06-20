import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only allow direct updates for admin users. All customer/provider edits must go through the approval flow.
  if (!['ROOT_ADMIN', 'SUB_ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Direct updates are disabled. Use the profile edit request flow instead.' }, { status: 403 })
  }

  const body = await req.json()
  const { nameEN, nameAR, mobile, email, avatar } = body || {}

  try {
    const updated = await prisma.user.update({ where: { id: user.id }, data: { nameEN, nameAR, mobile, email, avatar } })
    return NextResponse.json({ ok: true, user: { id: updated.id, nameEN: updated.nameEN, nameAR: updated.nameAR, mobile: updated.mobile, email: updated.email, avatar: updated.avatar } })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
