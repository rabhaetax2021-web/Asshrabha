import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const p = await prisma.catalogProduct.findUnique({ where: { id }, include: { unitRanges: true } })
    if (!p) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, product: p })
  } catch (err: unknown) {
    console.error('[api/catalog/product] error', getErrorMessage(err))
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
