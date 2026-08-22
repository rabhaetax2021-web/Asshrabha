import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { hasPermission } from '@/lib/utils/permissions'
import { prisma } from '@/lib/prisma'
import { normalizeEgyptMobile } from '@/lib/utils/helpers'

export async function GET(request: NextRequest) {
  const current = await getCurrentUser(request)
  if (!current || !hasPermission(current.role as any, current.permissions as any, 'MANAGE_WALLETS')) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const query = normalizeEgyptMobile(request.nextUrl.searchParams.get('number')?.trim() || '')
  if (query.length < 3) return NextResponse.json({ customers: [] })

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER', mobile: { contains: query } },
    select: {
      id: true,
      mobile: true,
      nameEN: true,
      nameAR: true,
      wallet: { select: { availableBalance: true, pendingBalance: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return NextResponse.json({ customers })
}