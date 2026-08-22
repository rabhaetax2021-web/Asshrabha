import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { getErrorMessage } from '@/lib/errors'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const current = await getCurrentUser()
    if (!current || !hasPermission(current.role as any, current.permissions as any, 'MANAGE_WALLETS')) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

    const { id } = await params
    const amount = Number((await request.json())?.amount)
    if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: 'invalid amount' }, { status: 400 })

    const customer = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } })
    if (!customer || customer.role !== 'CUSTOMER') return NextResponse.json({ error: 'customer not found' }, { status: 404 })

    const wallet = await prisma.$transaction(async (tx) => {
      const existing = await tx.wallet.findUnique({ where: { userId: id } })
      const target = existing || await tx.wallet.create({ data: { userId: id, availableBalance: 0, pendingBalance: 0, totalPaid: 0 } })
      await tx.wallet.update({ where: { id: target.id }, data: { availableBalance: { increment: amount } } })
      await tx.walletTransaction.create({ data: { walletId: target.id, amount, type: 'ADJUSTMENT', status: 'COMPLETED', note: 'Admin customer balance adjustment' } })
      return tx.wallet.findUnique({ where: { id: target.id }, include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } } })
    })

    return NextResponse.json({ ok: true, wallet })
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 })
  }
}