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
    const record = await tx.walletTransaction.create({
      data: { walletId: wallet.id, amount, type: 'DEPOSIT', status: 'COMPLETED' }
    })
    await tx.wallet.update({ where: { id: wallet.id }, data: { availableBalance: { increment: amount } } })
    return record
  })
  return transaction
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
