import { prisma } from '@/lib/prisma'

export async function creditProviderWallet(providerUserId: string, amount: number, reference?: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId: providerUserId } })
  if (!wallet) return null
  const tx = await prisma.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'ORDER_CREDIT', status: 'COMPLETED', reference } })
  await prisma.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: amount } } })
  return tx
}

export async function depositToWallet(userId: string, amount: number) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return null
  const transaction = await prisma.$transaction(async (tx) => {
    const record = await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'DEPOSIT', status: 'COMPLETED' } })
    await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: amount } } })
    return record
  })
  return transaction
}

export async function createDepositRequest(userId: string, amount: number, methodId?: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return null
  const result = await prisma.$transaction(async (tx) => {
    const dr = await (tx as any).depositRequest.create({ data: { walletId: wallet.id, amount, methodId: methodId || undefined, status: 'PENDING' } })
    await tx.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'DEPOSIT', status: 'PENDING', reference: dr.id } })
    return dr
  })
  return result
}

export async function approveDepositRequest(id: string, adminId: string) {
  const wr = await (prisma as any).depositRequest.findUnique({ where: { id } })
  if (!wr) return null
  if (wr.status !== 'PENDING') return { error: 'invalid status' }
  const result = await prisma.$transaction(async (tx) => {
    const updated = await (tx as any).depositRequest.update({ where: { id }, data: { status: 'APPROVED', processedBy: adminId, updatedAt: new Date() } })
    // find related pending wallet transaction (reference == depositRequest id)
    const pendingTx = await tx.walletTransaction.findFirst({ where: { walletId: wr.walletId, type: 'DEPOSIT', status: 'PENDING', reference: id } })
    if (pendingTx) {
      await tx.walletTransaction.update({ where: { id: pendingTx.id }, data: { status: 'COMPLETED' } })
    }
    await tx.wallet.update({ where: { id: wr.walletId }, data: { availableBalance: { increment: wr.amount }, pendingBalance: { decrement: wr.amount } } })
    return updated
  })
  return result
}

export async function rejectDepositRequest(id: string, adminId: string, note?: string) {
  const wr = await (prisma as any).depositRequest.findUnique({ where: { id } })
  if (!wr) return null
  if (wr.status !== 'PENDING') return { error: 'invalid status' }
  const result = await prisma.$transaction(async (tx) => {
    const updated = await (tx as any).depositRequest.update({ where: { id }, data: { status: 'REJECTED', processedBy: adminId, adminNote: note || null, updatedAt: new Date() } })
    const pendingTx = await tx.walletTransaction.findFirst({ where: { walletId: wr.walletId, type: 'DEPOSIT', status: 'PENDING', reference: id } })
    if (pendingTx) {
      await tx.walletTransaction.update({ where: { id: pendingTx.id }, data: { status: 'REJECTED' as any } })
    }
    return updated
  })
  return result
}

export async function requestWithdrawal(userId: string, amount: number) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return null
  if (wallet.availableBalance < amount) return { error: 'INSUFFICIENT_BALANCE' }
  const result = await prisma.$transaction(async (tx) => {
    const withdrawRequest = await tx.withdrawRequest.create({
      data: { walletId: wallet.id, amount, status: 'PENDING' }
    })
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, amount, type: 'WITHDRAWAL', status: 'PENDING' }
    })
    await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: amount }, pendingBalance: { increment: amount } } })
    return withdrawRequest
  })
  return result
}

export async function getWalletTransactions(userId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId } })
  if (!wallet) return []
  return await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
}
