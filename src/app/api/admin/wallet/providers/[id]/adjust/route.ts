import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const amount = Number(body?.amount)
    const action = body?.action === 'withdraw' ? 'withdraw' : 'deposit'

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
    }

    let wallet = await prisma.wallet.findUnique({ where: { userId: id } })
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId: id, availableBalance: 0, pendingBalance: 0, totalPaid: 0 } })
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (action === 'withdraw') {
        if (wallet.availableBalance < amount) {
          throw new Error('INSUFFICIENT_BALANCE')
        }
        await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: amount }, pendingBalance: { increment: amount } } })
        await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'WITHDRAWAL', status: 'PENDING', note: 'Admin withdrawal request' } })
      } else {
        await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: amount } } })
        await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'ADJUSTMENT', status: 'COMPLETED', note: 'Admin deposit adjustment' } })
      }

      return await tx.wallet.findUnique({ where: { id: wallet.id } })
    })

    const transactions = await prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, orderBy: { createdAt: 'desc' }, take: 20 })
    return NextResponse.json({ ok: true, wallet: { ...updated, transactions } })
  } catch (err: unknown) {
    const msg = getErrorMessage(err)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
