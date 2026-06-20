import { NextResponse } from 'next/server'
import { approveProvider, rejectProvider } from '@/lib/actions/admin.actions'
import { approveActionSchema } from '@/lib/validations/admin'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request, context: any) {
  try {
    const body = await request.json()
    const parsed = approveActionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { action, note, adminUserId } = parsed.data
    // server-side auth: only approved admins can perform this
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    if (action === 'approve') {
      const result = await approveProvider(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'reject') {
      const result = await rejectProvider(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'suspend') {
      const { suspendNote } = parsed.data as any
      const result = await (await import('@/lib/actions/admin.actions')).suspendProvider(id, adminUserId, suspendNote || note)
      return NextResponse.json({ ok: true, result });
    }
    if (action === 'set_visibility') {
      const { visible } = parsed.data as any
      if (typeof visible !== 'boolean') return NextResponse.json({ error: 'missing visible flag' }, { status: 400 })
      const result = await (await import('@/lib/actions/admin.actions')).setProviderVisibility(id, visible, adminUserId, note)
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
