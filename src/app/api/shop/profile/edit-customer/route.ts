import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { changes } = body
    if (!changes) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const req = await prisma.customerProfileEdit.create({ data: {
      userId: current.id,
      requestedBy: current.id,
      changes: changes as any,
      status: 'PENDING',
    }})

    return NextResponse.json({ ok: true, id: req.id })
  } catch (err: any) {
    console.error('[api/shop/profile/edit-customer] error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
