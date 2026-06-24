import { NextResponse } from 'next/server'
import { approveSuggestion, rejectSuggestion } from '@/lib/actions/admin.actions'
import { approveActionSchema } from '@/lib/validations/admin'
import { getCurrentUser } from '@/lib/auth'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: Request, context: unknown) {
  try {
    const body = await request.json()
    const parsed = approveActionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    const { action, note, adminUserId } = parsed.data
    const current = await getCurrentUser()
    if (!current || !['ROOT_ADMIN', 'SUB_ADMIN'].includes(current.role) || current.status !== 'APPROVED') {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    // context can be a resolved or promised params object from Next.js
    const rawParams = (context as any)?.params
    const params = rawParams && typeof rawParams.then === 'function' ? await rawParams : rawParams
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    if (action === 'approve') {
      if (typeof parsed.data.wholesaleMinPrice !== 'number' || typeof parsed.data.wholesaleMaxPrice !== 'number' || typeof parsed.data.retailMinPrice !== 'number' || typeof parsed.data.retailMaxPrice !== 'number') {
        return NextResponse.json({ error: 'Price range fields are required for approval' }, { status: 400 })
      }
      if (parsed.data.wholesaleMinPrice > parsed.data.wholesaleMaxPrice) {
        return NextResponse.json({ error: 'Wholesale min price must be less than or equal to wholesale max price' }, { status: 400 })
      }
      if (parsed.data.retailMinPrice > parsed.data.retailMaxPrice) {
        return NextResponse.json({ error: 'Retail min price must be less than or equal to retail max price' }, { status: 400 })
      }
      const result = await approveSuggestion(id, adminUserId, note, {
        wholesaleMinPrice: parsed.data.wholesaleMinPrice,
        wholesaleMaxPrice: parsed.data.wholesaleMaxPrice,
        retailMinPrice: parsed.data.retailMinPrice,
        retailMaxPrice: parsed.data.retailMaxPrice,
        categoryId: parsed.data.categoryId,
      })
      return NextResponse.json({ ok: true, result })
    }

    if (action === 'reject') {
      const result = await rejectSuggestion(id, adminUserId, note);
      return NextResponse.json({ ok: true, result })
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
