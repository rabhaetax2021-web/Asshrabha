import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function GET() {
  try {
    const methods = await (prisma as any).paymentMethod.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ ok: true, methods })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const body = await request.json()
    const name = String(body?.name || '').trim()
    const instructions = String(body?.instructions || '').trim()
    const active = Boolean(body?.active ?? true)
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const pm = await (prisma as any).paymentMethod.create({ data: { name, instructions: instructions || null, active } })
    return NextResponse.json({ ok: true, method: pm })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const body = await request.json()
    const id = body?.id
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    await (prisma as any).paymentMethod.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const body = await request.json()
    const id = body?.id
    const name = String(body?.name || '').trim()
    const instructions = String(body?.instructions || '').trim()
    const active = typeof body?.active === 'boolean' ? body.active : undefined
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const data: any = { name, instructions: instructions || null }
    if (typeof active === 'boolean') data.active = active
    const pm = await (prisma as any).paymentMethod.update({ where: { id }, data })
    return NextResponse.json({ ok: true, method: pm })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
