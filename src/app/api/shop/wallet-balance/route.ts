import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: currentUser.id },
      select: { availableBalance: true, pendingBalance: true }
    })

    if (!wallet) {
      return NextResponse.json({ 
        availableBalance: 0, 
        pendingBalance: 0 
      })
    }

    return NextResponse.json({
      availableBalance: wallet.availableBalance,
      pendingBalance: wallet.pendingBalance
    })
  } catch (error: unknown) {
    console.error('Failed to fetch wallet balance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wallet balance' },
      { status: 500 }
    )
  }
}
