import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(current.role === 'ROOT_ADMIN' || current.role === 'SUB_ADMIN')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const rooms = await prisma.chatRoom.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: { include: { user: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  })

  return NextResponse.json({ ok: true, rooms })
}

export async function DELETE(request: Request) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(current.role === 'ROOT_ADMIN' || current.role === 'SUB_ADMIN')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  try {
    const body = await request.json().catch(() => ({}))
    const { id } = body
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    await prisma.chatRoom.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const current = await getCurrentUser()
  if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!(current.role === 'ROOT_ADMIN' || current.role === 'SUB_ADMIN')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  try {
    const body = await request.json().catch(() => ({}))
    const { id, isClosed } = body
    if (!id || typeof isClosed !== 'boolean') return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    await prisma.chatRoom.update({ where: { id }, data: { isClosed } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
