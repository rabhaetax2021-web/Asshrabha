import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { isAdmin } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: Request, context: { params: any }) {
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
      // mark withdraw request approved
      const updated = await tx.withdrawRequest.update({ where: { id }, data: { status: 'APPROVED', processedBy: current.id, updatedAt: new Date() } })

      // find corresponding pending wallet transaction and mark completed
      const pendingTx = await tx.walletTransaction.findFirst({ where: { walletId: wr.walletId, type: 'WITHDRAWAL', status: 'PENDING' } })
      if (pendingTx) {
        await tx.walletTransaction.update({ where: { id: pendingTx.id }, data: { status: 'COMPLETED' } })
      }

      // reduce pendingBalance (funds are considered paid out)
      await tx.wallet.update({ where: { id: wr.walletId }, data: { pendingBalance: { decrement: wr.amount } } })

      return updated
    })

    return NextResponse.json({ ok: true, result })
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 })
  }
}
