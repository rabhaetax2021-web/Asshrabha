import { NextResponse } from 'next/server'
import { getProviders } from '@/lib/actions/admin.actions'
import { getErrorMessage } from '@/lib/errors'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const providers = await getProviders()
    const out = providers.map((p: Record<string, unknown>) => ({ id: String((p as Record<string, unknown>).id), name: String((p as Record<string, unknown>).shopNameEN ?? ((p as Record<string, unknown>).user as Record<string, unknown> | undefined)?.nameEN ?? (p as Record<string, unknown>).id) }))
    return NextResponse.json({ ok: true, providers: out })
  } catch (err: unknown) {
    console.error('[api/admin/providers] error', getErrorMessage(err))
    return NextResponse.json({ ok: false, error: getErrorMessage(err) }, { status: 500 })
  }
}
