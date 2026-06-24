import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { createDepositRequest } from '@/lib/actions/wallet.actions'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const body = await request.json()
    const amount = Number(body?.amount)
    const methodId = body?.methodId as string | undefined
    if (!amount || amount <= 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
    const dr = await createDepositRequest(current.id, amount, methodId)
    if (!dr) return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
    return NextResponse.json({ ok: true, request: dr })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
