import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { approveDepositRequest } from '@/lib/actions/wallet.actions'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    const result = await approveDepositRequest(id, current.id)
    if (!result) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
