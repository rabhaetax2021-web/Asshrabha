import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { requestWithdrawal } from '@/lib/actions/wallet.actions'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const body = await request.json()
    const amount = Number(body?.amount)
    if (!amount || amount <= 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
    const result = await requestWithdrawal(current.id, amount)
    if (!result) return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
    if (typeof result === 'object' && result !== null && 'error' in result) {
      // result may be a { error: string } shape from the service
      return NextResponse.json({ error: (result as any).error }, { status: 400 })
    }
    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
