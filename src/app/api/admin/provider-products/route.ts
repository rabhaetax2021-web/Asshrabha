import { NextRequest, NextResponse } from 'next/server'
import { getProductsByProviderId } from '@/lib/actions/provider.actions'
import { getErrorMessage } from '@/lib/errors'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const providerId = url.searchParams.get('providerId')
    if (!providerId) return NextResponse.json({ ok: false, error: 'missing providerId' }, { status: 400 })
    const products = await getProductsByProviderId(providerId)
    const out = products.map((p: Record<string, unknown>) => ({ id: String((p as Record<string, unknown>).id), name: String((p as Record<string, unknown>).name ?? (p as Record<string, unknown>).title ?? (p as Record<string, unknown>).id) }))
    return NextResponse.json({ ok: true, products: out })
  } catch (err: unknown) {
    console.error('[api/admin/provider-products] error', getErrorMessage(err))
    return NextResponse.json({ ok: false, error: getErrorMessage(err) }, { status: 500 })
  }
}
