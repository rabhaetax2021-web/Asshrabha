import { NextResponse } from 'next/server'
import { getProviders } from '@/lib/actions/admin.actions'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const providers = await getProviders()
    const out = providers.map((p: any) => ({ id: p.id, name: p.storeName || p.user?.name || p.id }))
    return NextResponse.json({ ok: true, providers: out })
  } catch (err: any) {
    console.error('[api/admin/providers] error', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
