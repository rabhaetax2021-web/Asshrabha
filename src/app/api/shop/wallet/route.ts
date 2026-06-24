import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function GET(request: Request) {
  try {
    const current = await getCurrentUser()
    if (!current) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

    const wallet = await prisma.wallet.findUnique({ where: { userId: current.id } })
    if (!wallet) return NextResponse.json({ error: 'wallet not found' }, { status: 404 })

    const transactions = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' }, take: 200 })

    return NextResponse.json({ ok: true, wallet, transactions })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
