import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { rejectDepositRequest } from '@/lib/actions/wallet.actions'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const body = await request.json()
    const note = String(body?.note || '')
    const result = await rejectDepositRequest(id, current.id, note || undefined)
    if (!result) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
