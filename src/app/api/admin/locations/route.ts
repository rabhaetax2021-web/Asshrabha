import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth'

export async function GET() {
  try {
    const locations = await prisma.location.findMany({ orderBy: { nameEN: 'asc' } })
    return NextResponse.json({ ok: true, locations })
  } catch (err: any) {
    console.error('[api/admin/locations] GET error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN','SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const body = await request.json()
    const { nameEN, nameAR } = body
    if (!nameEN) return NextResponse.json({ error: 'missing fields' }, { status: 400 })

    const loc = await prisma.location.create({ data: { nameEN, nameAR: nameAR || '' } })
    return NextResponse.json({ ok: true, location: loc })
  } catch (err: any) {
    console.error('[api/admin/locations] POST error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
