import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  try {
    const params = await context.params
    const current = await getCurrentUser()
    if (!current || !isAdmin(current.role as any)) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const id = params.id
    const wr = await prisma.withdrawRequest.findUnique({ where: { id } })
    if (!wr) return NextResponse.json({ error: 'not found' }, { status: 404 })

    if (wr.status !== 'PENDING') return NextResponse.json({ error: 'invalid status' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.withdrawRequest.update({ where: { id }, data: { status: 'REJECTED' as any, processedBy: current.id, updatedAt: new Date() } })

      // mark related wallet transaction as rejected
      const pendingTx = await tx.walletTransaction.findFirst({ where: { walletId: wr.walletId, type: 'WITHDRAWAL', status: 'PENDING' } })
      if (pendingTx) {
        await tx.walletTransaction.update({ where: { id: pendingTx.id }, data: { status: 'REJECTED' as any } })
      }

      // move funds back to available balance
      await tx.wallet.update({ where: { id: wr.walletId }, data: { pendingBalance: { decrement: wr.amount }, availableBalance: { increment: wr.amount } } })

      return updated
    })

    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
