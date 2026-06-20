import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { depositToWallet } from '@/lib/actions/wallet.actions'

export async function POST(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    const body = await request.json()
    const amount = Number(body?.amount)
    if (!amount || amount <= 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
    const tx = await depositToWallet(current.id, amount)
    if (!tx) return NextResponse.json({ error: 'wallet not found' }, { status: 404 })
    return NextResponse.json({ ok: true, tx })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
