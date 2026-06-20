import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const p = await prisma.catalogProduct.findUnique({ where: { id }, include: { unitRanges: true } })
    if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, product: p })
  } catch (err: any) {
    console.error('[api/catalog/product] error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
