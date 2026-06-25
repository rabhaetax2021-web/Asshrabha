import { NextRequest, NextResponse } from 'next/server'
import { approveProviderProduct, rejectProviderProduct } from '@/lib/actions/admin.actions'
import { approveActionSchema } from '@/lib/validations/admin'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

async function resolveParams(p: unknown) {
  if (p && typeof (p as { then?: Function }).then === 'function') return await (p as Promise<Record<string, unknown>>)
  return p as Record<string, unknown> | undefined
}

export async function POST(request: NextRequest, context: { params: Promise<Record<string, unknown>> }) {
  try {
    const body = await request.json()
    const parsed = approveActionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { action, note, adminUserId } = parsed.data
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const params = await resolveParams(context.params)
    const id = params?.id as string | undefined
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    if (action === 'approve') {
      const result = await approveProviderProduct(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'reject') {
      const result = await rejectProviderProduct(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
