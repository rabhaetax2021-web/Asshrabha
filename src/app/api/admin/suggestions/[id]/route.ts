import { NextResponse } from 'next/server'
import { approveSuggestion, rejectSuggestion } from '@/lib/actions/admin.actions'
import { approveActionSchema } from '@/lib/validations/admin'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: Request, context: any) {
  try {
    const body = await request.json()
    const parsed = approveActionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { action, note, adminUserId } = parsed.data
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    const rawParams = context?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    if (action === 'approve') {
      const result = await approveSuggestion(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    if (action === 'reject') {
      const result = await rejectSuggestion(id, adminUserId, note);
      return NextResponse.json({ ok: true, result });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
