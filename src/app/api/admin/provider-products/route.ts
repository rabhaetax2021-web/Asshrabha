import { NextResponse } from 'next/server'
import { getProductsByProviderId } from '@/lib/actions/provider.actions'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const providerId = url.searchParams.get('providerId')
    if (!providerId) return NextResponse.json({ ok: false, error: 'missing providerId' }, { status: 400 })
    const products = await getProductsByProviderId(providerId)
    const out = products.map((p: any) => ({ id: p.id, name: p.name || p.title || p.id }))
    return NextResponse.json({ ok: true, products: out })
  } catch (err: any) {
    console.error('[api/admin/provider-products] error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
