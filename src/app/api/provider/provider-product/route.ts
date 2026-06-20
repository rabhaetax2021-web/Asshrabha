import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const pp = await prisma.providerProduct.findUnique({
      where: { id },
      include: { catalogProduct: true, provider: true, providerProductOptions: true },
    })
    if (!pp) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, product: pp })
  } catch (err: any) {
    console.error('[api/provider/provider-product] error', err)
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
